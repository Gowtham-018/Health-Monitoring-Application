# PulseMate System Test Cases

## Authentication Tests

### TC_001: User Signup - Valid Data
- **Preconditions**: None
- **Test Steps**:
  1. Navigate to signup page
  2. Enter valid email, password (8+ chars, uppercase, lowercase, number, special), role=user
  3. Click signup
- **Expected Result**: User created, redirected to login, success message
- **Actual Result**:
- **Pass/Fail**:

### TC_002: User Signup - Invalid Password
- **Preconditions**: None
- **Test Steps**:
  1. Navigate to signup page
  2. Enter email, password="short", role=user
  3. Click signup
- **Expected Result**: Error message: "Password must be at least 8 characters..."
- **Actual Result**:
- **Pass/Fail**:

### TC_003: User Signup - Duplicate Email
- **Preconditions**: User with email "test@example.com" exists
- **Test Steps**:
  1. Navigate to signup page
  2. Enter email="test@example.com", valid password, role=user
  3. Click signup
- **Expected Result**: Error: "Email already registered"
- **Actual Result**:
- **Pass/Fail**:

### TC_004: User Login - Valid Credentials
- **Preconditions**: User account exists
- **Test Steps**:
  1. Navigate to login page
  2. Enter correct email and password
  3. Click login
- **Expected Result**: JWT token issued, redirected to dashboard
- **Actual Result**:
- **Pass/Fail**:

### TC_005: User Login - Invalid Credentials
- **Preconditions**: None
- **Test Steps**:
  1. Navigate to login page
  2. Enter wrong email or password
  3. Click login
- **Expected Result**: Error: "Incorrect email or password"
- **Actual Result**:
- **Pass/Fail**:

### TC_006: Access Protected Route Without Token
- **Preconditions**: None
- **Test Steps**:
  1. Try to access /chat/query without JWT token
- **Expected Result**: 401 Unauthorized
- **Actual Result**:
- **Pass/Fail**:

## Chatbot Tests

### TC_007: Chatbot Query - Basic Response
- **Preconditions**: User logged in
- **Test Steps**:
  1. Send query: "How do I logout?"
  2. Check response
- **Expected Result**: Relevant answer from knowledge base
- **Actual Result**:
- **Pass/Fail**:

### TC_008: Chatbot Query - Role-Based Filtering
- **Preconditions**: User role=user logged in
- **Test Steps**:
  1. Send query: "Where is analytics?"
  2. Check response
- **Expected Result**: No admin-specific info, general response
- **Actual Result**:
- **Pass/Fail**:

### TC_009: Chatbot Query - Ticket Suggestion
- **Preconditions**: User logged in
- **Test Steps**:
  1. Send query: "My device is not connecting"
  2. Check response
- **Expected Result**: Suggested action: "raise_ticket", ticket_context provided
- **Actual Result**:
- **Pass/Fail**:

### TC_010: Chatbot Query - Conversation History
- **Preconditions**: User logged in, previous chat exists
- **Test Steps**:
  1. Send follow-up query
  2. Check if history is used in response
- **Expected Result**: Context-aware response using history
- **Actual Result**:
- **Pass/Fail**:

### TC_011: Chatbot Query - No Relevant Knowledge
- **Preconditions**: User logged in
- **Test Steps**:
  1. Send query: "What is the weather?"
  2. Check response
- **Expected Result**: Response indicates info not available
- **Actual Result**:
- **Pass/Fail**:

### TC_012: Chatbot Query - Error Handling
- **Preconditions**: Gemini API down
- **Test Steps**:
  1. Send query
  2. Check response
- **Expected Result**: Error message, fallback behavior
- **Actual Result**:
- **Pass/Fail**:

## Ticket Creation Tests

### TC_013: Ticket Creation - Valid Data
- **Preconditions**: User logged in
- **Test Steps**:
  1. Call POST /tickets/lifecycle with valid short_description, description
  2. Check response
- **Expected Result**: Ticket created, ID returned, source=servicenow or local-fallback
- **Actual Result**:
- **Pass/Fail**:

### TC_014: Ticket Creation - Missing Description
- **Preconditions**: User logged in
- **Test Steps**:
  1. Call POST /tickets/lifecycle without description
  2. Check response
- **Expected Result**: Error: "Missing required fields"
- **Actual Result**:
- **Pass/Fail**:

### TC_015: Ticket Creation - Auto Resolve
- **Preconditions**: User logged in
- **Test Steps**:
  1. Call POST /tickets/lifecycle with auto_resolve=true, resolution_notes
  2. Check response
- **Expected Result**: Ticket created and closed, status=resolved
- **Actual Result**:
- **Pass/Fail**:

### TC_016: Ticket Creation - ServiceNow Failure
- **Preconditions**: ServiceNow server down
- **Test Steps**:
  1. Call POST /tickets/lifecycle
  2. Check response
- **Expected Result**: Ticket stored locally, source=local-fallback
- **Actual Result**:
- **Pass/Fail**:

### TC_017: Ticket Listing - User Tickets
- **Preconditions**: User logged in, tickets exist
- **Test Steps**:
  1. Call GET /tickets/
  2. Check response
- **Expected Result**: List of user's tickets
- **Actual Result**:
- **Pass/Fail**:

### TC_018: Ticket Update - Status Change
- **Preconditions**: Ticket exists
- **Test Steps**:
  1. Call PATCH /tickets/:id/status with status="in progress"
  2. Check response
- **Expected Result**: Ticket status updated
- **Actual Result**:
- **Pass/Fail**:

## ServiceNow Integration Tests

### TC_019: ServiceNow Incident Creation
- **Preconditions**: ServiceNow server running
- **Test Steps**:
  1. Create ticket via FastAPI
  2. Check ServiceNow instance
- **Expected Result**: Incident created in ServiceNow
- **Actual Result**:
- **Pass/Fail**:

### TC_020: ServiceNow Status Update
- **Preconditions**: Incident exists in ServiceNow
- **Test Steps**:
  1. Update status via FastAPI
  2. Check ServiceNow
- **Expected Result**: Status updated in ServiceNow
- **Actual Result**:
- **Pass/Fail**:

### TC_021: ServiceNow Incident Closure
- **Preconditions**: Incident exists
- **Test Steps**:
  1. Close ticket via FastAPI with resolution_notes
  2. Check ServiceNow
- **Expected Result**: Incident closed with notes
- **Actual Result**:
- **Pass/Fail**:

### TC_022: ServiceNow API Timeout
- **Preconditions**: ServiceNow slow/unresponsive
- **Test Steps**:
  1. Create ticket
  2. Check response
- **Expected Result**: Fallback to local storage
- **Actual Result**:
- **Pass/Fail**:

### TC_023: ServiceNow Invalid Credentials
- **Preconditions**: Wrong SN_USERNAME/SN_PASSWORD
- **Test Steps**:
  1. Create ticket
  2. Check response
- **Expected Result**: Fallback to local, error logged
- **Actual Result**:
- **Pass/Fail**:

### TC_024: ServiceNow Retry Logic
- **Preconditions**: ServiceNow temporarily down
- **Test Steps**:
  1. Create ticket
  2. Check attempts in response
- **Expected Result**: Retries up to 2 times, then fallback
- **Actual Result**:
- **Pass/Fail**:

## Role-Based Restriction Tests

### TC_025: Admin Access - Analytics Query
- **Preconditions**: Admin logged in
- **Test Steps**:
  1. Query chatbot: "Where is analytics?"
  2. Check response
- **Expected Result**: Admin-specific info included
- **Actual Result**:
- **Pass/Fail**:

### TC_026: User Access - Restricted Query
- **Preconditions**: User logged in
- **Test Steps**:
  1. Query chatbot: "How do I manage tickets?"
  2. Check response
- **Expected Result**: No admin info, user-appropriate response
- **Actual Result**:
- **Pass/Fail**:

### TC_027: Admin Ticket Access
- **Preconditions**: Admin logged in
- **Test Steps**:
  1. Call GET /tickets/
  2. Check response
- **Expected Result**: All tickets listed (if admin endpoint exists)
- **Actual Result**:
- **Pass/Fail**:

### TC_028: User Ticket Access
- **Preconditions**: User logged in
- **Test Steps**:
  1. Call GET /tickets/
  2. Check response
- **Expected Result**: Only user's tickets listed
- **Actual Result**:
- **Pass/Fail**:

### TC_029: Role-Based Knowledge Retrieval
- **Preconditions**: ChromaDB loaded
- **Test Steps**:
  1. Query as user: admin-only topic
  2. Check retrieved docs
- **Expected Result**: No admin docs returned
- **Actual Result**:
- **Pass/Fail**:

### TC_030: Unauthorized Endpoint Access
- **Preconditions**: User logged in
- **Test Steps**:
  1. Try to access admin-only endpoint as user
- **Expected Result**: 403 Forbidden
- **Actual Result**:
- **Pass/Fail**: