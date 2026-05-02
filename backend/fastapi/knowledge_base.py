ADMIN_KNOWLEDGE = [
    {
        "id": "admin_nav_1",
        "query": "Where can I find analytics?",
        "answer": "Analytics are available from the Admin Dashboard. Use the Analytics tab to review users, open tickets, and system performance.",
        "category": "navigation",
        "role_restriction": "admin",
        "scope": "admin",
    },
    {
        "id": "admin_faq_1",
        "query": "How do I manage ticket assignments?",
        "answer": "Open the ticket management panel from the Admin Dashboard and assign tickets to support agents or groups.",
        "category": "faqs",
        "role_restriction": "admin",
        "scope": "admin",
    },
    {
        "id": "admin_trouble_1",
        "query": "How do I escalate a ticket?",
        "answer": "Use the escalation controls on the ticket details page. Notify the relevant team and add escalation notes before updating the ticket status.",
        "category": "troubleshooting",
        "role_restriction": "admin",
        "scope": "admin",
    },
]

USER_KNOWLEDGE = [
    {
        "id": "user_nav_1",
        "query": "How do I open a new ticket?",
        "answer": "Click the 'Create Ticket' button in the main menu, fill in the details, and submit your issue. A support agent will follow up.",
        "category": "navigation",
        "role_restriction": "user",
        "scope": "user",
    },
    {
        "id": "user_faq_1",
        "query": "Can I track my ticket status?",
        "answer": "Yes. After creating a ticket, you can view its status on your dashboard under 'My Tickets'.",
        "category": "faqs",
        "role_restriction": "user",
        "scope": "user",
    },
    {
        "id": "user_trouble_1",
        "query": "What should I do if my device loses connection?",
        "answer": "Try reconnecting the device, checking your network, and restarting the app. If the issue persists, raise a ticket with device diagnostics.",
        "category": "troubleshooting",
        "role_restriction": "user",
        "scope": "user",
    },
]

SHARED_KNOWLEDGE = [
    {
        "id": "shared_nav_1",
        "query": "Where is the dashboard?",
        "answer": "The dashboard is the main hub for PulseMate. It shows role-specific widgets once you sign in.",
        "category": "navigation",
        "role_restriction": None,
        "scope": "shared",
    },
    {
        "id": "shared_nav_2",
        "query": "How do I log out?",
        "answer": "Select your profile icon in the top-right and choose 'Logout' to end your session.",
        "category": "navigation",
        "role_restriction": None,
        "scope": "shared",
    },
    {
        "id": "shared_faq_1",
        "query": "What are the user roles?",
        "answer": "PulseMate supports User and Admin roles. Users monitor vitals and raise tickets, while Admins manage analytics and tickets.",
        "category": "faqs",
        "role_restriction": None,
        "scope": "shared",
    },
    {
        "id": "shared_trouble_1",
        "query": "How do I reset my password?",
        "answer": "Go to the login screen, click 'Forgot Password', and follow the reset link sent to your email.",
        "category": "troubleshooting",
        "role_restriction": None,
        "scope": "shared",
    },
]


def get_all_knowledge():
    """Return every knowledge document from all scopes."""
    return SHARED_KNOWLEDGE + USER_KNOWLEDGE + ADMIN_KNOWLEDGE


def get_knowledge_by_scope(scope: str):
    """Return knowledge for a specific scope: admin, user, or shared."""
    if scope == "admin":
        return ADMIN_KNOWLEDGE
    if scope == "user":
        return USER_KNOWLEDGE
    if scope == "shared":
        return SHARED_KNOWLEDGE
    return get_all_knowledge()


def get_knowledge_base_for_role(role: str):
    """Filter knowledge base based on user role."""
    filtered = []
    for doc in get_all_knowledge():
        if doc["role_restriction"] is None or doc["role_restriction"] == role:
            filtered.append(doc)
    return filtered


def serialize_knowledge_base():
    """Serialize all knowledge base documents into text chunks for ChromaDB."""
    chunks = []
    for doc in get_all_knowledge():
        text = f"{doc['query']}\n{doc['answer']}"
        chunks.append(
            {
                "id": doc["id"],
                "text": text,
                "category": doc["category"],
                "scope": doc["scope"],
                "role_restriction": doc["role_restriction"],
                "metadata": {
                    "category": doc["category"],
                    "scope": doc["scope"],
                    "role_restriction": doc["role_restriction"],
                },
            }
        )
    return chunks
