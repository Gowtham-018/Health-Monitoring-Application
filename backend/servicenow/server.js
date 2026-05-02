require('dotenv').config();
const express = require('express');
const {
  initDatabase,
  createIncidentLocal,
  getIncidentById,
  updateIncidentLocal,
} = require('./db/sqlite');
const {
  ServiceNowError,
  createIncident,
  updateIncidentStatus,
  closeIncident,
} = require('./services/servicenowService');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

const respondError = (res, error) => {
  const status = error instanceof ServiceNowError ? 502 : 500;
  return res.status(status).json({
    success: false,
    message: error.message,
    details: error.details || null,
  });
};

app.post('/api/incidents', async (req, res) => {
  const { short_description, description, urgency, impact, caller_id } = req.body;

  if (!short_description) {
    return res.status(400).json({ success: false, message: 'short_description is required.' });
  }

  const localPayload = {
    short_description,
    description,
    urgency,
    impact,
    caller_id,
    status: 'new',
  };

  try {
    const snResult = await createIncident(localPayload);

    const incident = await createIncidentLocal({
      servicenowSysId: snResult.sys_id,
      ...localPayload,
      status: 'new',
      source: 'servicenow',
    });

    return res.status(201).json({
      success: true,
      source: 'servicenow',
      incident,
      servicNowResult: snResult,
    });
  } catch (error) {
    if (error instanceof ServiceNowError) {
      const incident = await createIncidentLocal({
        ...localPayload,
        status: 'pending',
        source: 'local-fallback',
      });

      return res.status(201).json({
        success: true,
        source: 'local-fallback',
        incident,
        error: error.message,
      });
    }

    return respondError(res, error);
  }
});

app.patch('/api/incidents/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'status is required.' });
  }

  try {
    const incident = await getIncidentById(id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    if (incident.servicenow_sys_id) {
      try {
        await updateIncidentStatus(incident.servicenow_sys_id, status);
      } catch (serviceNowError) {
        if (serviceNowError instanceof ServiceNowError) {
          const updated = await updateIncidentLocal(id, { status, source: 'local-fallback' });
          return res.status(200).json({
            success: true,
            source: 'local-fallback',
            incident: updated,
            error: serviceNowError.message,
          });
        }
        throw serviceNowError;
      }
    }

    const updatedIncident = await updateIncidentLocal(id, { status, source: incident.servicenow_sys_id ? 'servicenow' : 'local-fallback' });
    return res.status(200).json({ success: true, incident: updatedIncident });
  } catch (error) {
    return respondError(res, error);
  }
});

app.post('/api/incidents/:id/close', async (req, res) => {
  const { id } = req.params;
  const { resolution_notes } = req.body;

  if (!resolution_notes) {
    return res.status(400).json({ success: false, message: 'resolution_notes is required.' });
  }

  try {
    const incident = await getIncidentById(id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    if (incident.servicenow_sys_id) {
      try {
        await closeIncident(incident.servicenow_sys_id, resolution_notes);
      } catch (serviceNowError) {
        if (serviceNowError instanceof ServiceNowError) {
          const updated = await updateIncidentLocal(id, {
            status: 'closed',
            resolution_notes,
            source: 'local-fallback',
          });
          return res.status(200).json({
            success: true,
            source: 'local-fallback',
            incident: updated,
            error: serviceNowError.message,
          });
        }
        throw serviceNowError;
      }
    }

    const updatedIncident = await updateIncidentLocal(id, {
      status: 'closed',
      resolution_notes,
      source: incident.servicenow_sys_id ? 'servicenow' : 'local-fallback',
    });
    return res.status(200).json({ success: true, incident: updatedIncident });
  } catch (error) {
    return respondError(res, error);
  }
});

app.get('/api/incidents/:id', async (req, res) => {
  try {
    const incident = await getIncidentById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }
    return res.status(200).json({ success: true, incident });
  } catch (error) {
    return respondError(res, error);
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

const startServer = async () => {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`ServiceNow Express server running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
