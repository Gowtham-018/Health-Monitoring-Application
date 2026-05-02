const axios = require('axios');

class ServiceNowError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ServiceNowError';
    this.details = details;
  }
}

const SN_INSTANCE = process.env.SN_INSTANCE;
const SN_USERNAME = process.env.SN_USERNAME;
const SN_PASSWORD = process.env.SN_PASSWORD;
const SN_TABLE = process.env.SN_TABLE || 'incident';

if (!SN_INSTANCE || !SN_USERNAME || !SN_PASSWORD) {
  throw new Error('Missing ServiceNow configuration. Set SN_INSTANCE, SN_USERNAME, and SN_PASSWORD.');
}

const client = axios.create({
  baseURL: `https://${SN_INSTANCE}/api/now/table/${SN_TABLE}`,
  auth: {
    username: SN_USERNAME,
    password: SN_PASSWORD,
  },
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

const translateStatusToState = (status) => {
  if (!status) return undefined;
  const normalized = String(status).trim().toLowerCase();
  const map = {
    new: 1,
    'in progress': 2,
    in_progress: 2,
    onhold: 3,
    'on hold': 3,
    resolved: 6,
    closed: 7,
  };

  const numeric = Number(normalized);
  if (!Number.isNaN(numeric) && normalized !== '') {
    return numeric;
  }

  return map[normalized];
};

const toError = (error) => {
  if (error.response) {
    return new ServiceNowError(
      `ServiceNow API error ${error.response.status}: ${JSON.stringify(error.response.data)}`,
      error.response.data
    );
  }

  return new ServiceNowError('ServiceNow unavailable', error.message || error);
};

const createIncident = async ({
  short_description,
  description,
  urgency,
  impact,
  caller_id,
}) => {
  try {
    const payload = {
      short_description,
      description,
      urgency,
      impact,
      caller_id,
    };
    const response = await client.post('', payload);
    const record = response.data?.result;

    if (!record) {
      throw new ServiceNowError('Invalid response from ServiceNow when creating incident.');
    }

    return {
      sys_id: record.sys_id,
      number: record.number,
      status: record.state ?? 'new',
      raw: record,
    };
  } catch (error) {
    throw toError(error);
  }
};

const updateIncidentStatus = async (sysId, status) => {
  if (!sysId) {
    throw new ServiceNowError('ServiceNow incident sys_id is required to update status.');
  }

  const state = translateStatusToState(status);
  if (state === undefined) {
    throw new ServiceNowError('Unsupported ServiceNow status value.');
  }

  try {
    const response = await client.patch(`/${sysId}`, { state });
    return response.data?.result || null;
  } catch (error) {
    throw toError(error);
  }
};

const closeIncident = async (sysId, resolution_notes) => {
  if (!sysId) {
    throw new ServiceNowError('ServiceNow incident sys_id is required to close incident.');
  }

  try {
    const response = await client.patch(`/${sysId}`, {
      state: 7,
      close_notes: resolution_notes,
      resolution_notes,
    });

    return response.data?.result || null;
  } catch (error) {
    throw toError(error);
  }
};

module.exports = {
  ServiceNowError,
  createIncident,
  updateIncidentStatus,
  closeIncident,
};
