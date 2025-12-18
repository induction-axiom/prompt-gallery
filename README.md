# Prompt Gallery

> [!NOTE]
> This project is evolving rapidly with the help of AI. This README documents our current implementation and future goals.

## Project Vision

**Nano Banana Pro Prompt Marketplace**

Our end goal is to create a dynamic marketplace where users can:
- **Discover** interesting prompts created by others.
- **Upload** their own high-quality prompt templates.
- **Generate** pictures using these prompt templates.
- **Share & Interact**: Generated results are public by default. Users can like prompts/results, and a feed will show top-ranked content.

## Architecture & Tech Stack

We utilize a modern stack to move fast during Hackweek:

### Frontend
- **React** (via Vite)
- **Tailwind CSS** for styling
- **Google Sign-In** for authentication
- **useReducer** for complex state management (Templates & Executions)

### Backend & AI
- **Firebase Cloud Functions** (v2): Serverless backend handling API logic.
- **Firebase AI Logic**: Accessed via Cloud Functions to generate content from templates. *Note: We utilize Gemini Developer AI endpoints.*

### Data & Hosting
- **Firestore**: Stores user data, ownership information, and execution history (text & image metadata).
- **Firebase AI Logic**: The *Single Source of Truth* for prompt template content (display name, template string, etc.).
- **Firebase Storage**: Stores generated images.
- **Firebase Hosting**: Serves the web application.

---

## Current Status: Implemented Features

The application currently supports the core "Admin" and "Runner" flows:

1.  **Authentication**: Users can sign in using Google Auth.
2.  **Template Management (CRUD)**:
    -   **List**: View all available prompt templates.
    -   **Create**: Add new templates with a display name and dot-prompt string.
    -   **Update**: Edit existing templates via a popup editor.
    -   **Delete**: Remove templates (Ownership protected: users can only delete their own templates).
3.  **Template Artifact**:
    -   **Run**: Select a template, provide JSON input variables, and execute it.
    -   **AI Input Generation**: Auto-fill default inputs or use the "Dice" button to generate random, context-aware test data using AI.
    -   **Mixed Media Results**: Supports both Image generation (saved to Storage) and Text generation (text cards), displayed in a unified gallery.
    -   **Auto-Save**: All executions are automatically saved to Firestore/Storage.
    -   **Public by Default**: Executions are marked as public to enable sharing.

## Roadmap (To-Do)

The following features are designed but **not yet implemented**:

-   [x] **Result Storage**: Store generated images in **Firebase Cloud Storage** and metadata in **Firestore**.
-   [x] **Public Access Control**: Basic boolean flag (`public`) implementation in Firestore and Storage.
-   [x] **Artifact History**: Show past execution results in the template card (Implemented as Mixed Media Gallery).
-   [x] **AI Parameter Generation**: Use AI to auto-generate input parameters (e.g., a "Dice" button for random valid inputs).
-   [x] **Ownership Protection**: Users can only modify/delete their own data.
-   [x] **Social Interactions**: "Like" functionality for prompts and results.
-   [ ] **AI Labeling**: Use AI to attach labels/tags to prompts automatically.
-   [ ] **AI Template Assistance**: Use AI to help users create dot-prompt strings (format suggestions, model ID selection).
-   [ ] **Pagination**: Implement "Load More" functionality for the template list.
-   [ ] **Advanced Filtering**: Rank and filter prompts by specific criteria (likes, date, tags).

---

## Backend API Reference

The backend logic is implemented in `functions/index.js` and exposes the following Callable Functions:

| Function Name | Description | Inputs |
| :--- | :--- | :--- |
| `listPromptTemplates` | Fetches a paginated list of templates from Firebase AI Logic. | `pageSize`, `pageToken` |
| `createPromptTemplate` | Creates a new prompt template. | `displayName`, `dotPromptString` |
| `updatePromptTemplate` | Updates the display name or template string of an existing template. | `templateId`, `displayName`, `dotPromptString` |
| `deletePromptTemplate` | Deletes a specific template. | `templateId` |
| `runPromptTemplate` | Executes a specific template with user-provided variables. | `templateId`, `reqBody` (JSON) |