# Prompt Gallery

> [!NOTE]
> This project is evolving rapidly with the help of AI. This README documents our current implementation and future goals.

## Project Vision

**Prompt Gallery**

Our goal is to create a dynamic marketplace where users can:
- **Discover** interesting prompts created by others.
- **Upload** their own high-quality prompt templates.
- **Generate** pictures using these prompt templates.
- **Share & Interact**: Generated results are public by default. Users can like prompts/results, and a feed shows top-ranked content.

## Architecture & Tech Stack

We utilize a modern stack to move fast:

### Frontend
- **React** (via Vite)
- **Tailwind CSS** for styling (Custom Firebase Theme)
- **Google Sign-In** for authentication
- **Context API + useReducer** for efficient state management

### Backend & AI
- **Firebase Cloud Functions** (v2): Serverless backend handling API logic.
- **Firebase AI Logic**: Accessed via Cloud Functions to generate content from templates. *Note: We utilize Gemini Developer AI endpoints.*

### Data & Hosting
- **Firestore**: Stores user data, ownership information, and creation history (text & image metadata).
- **Firebase AI Logic**: The *Single Source of Truth* for prompt template content.
- **Firebase Storage**: Stores generated images.
- **Firebase Hosting**: Serves the web application.

---

## Current Status: Implemented Features

The application currently supports a rich set of features for Prompt Engineers and Users:

1.  **Authentication**: Seamless sign-in using Google Auth.
2.  **Template Management (CRUD)**:
    -   **List**: View all available prompt templates in a responsive grid.
    -   **Create**: Add new templates with a display name and dot-prompt string.
    -   **Update**: Edit existing templates via a popup editor.
    -   **Delete**: Remove templates (Ownership protected).
3.  **Advanced AI Tools**:
    -   **Auto Labeler**: Automatically tags prompts using AI for better discovery.
    -   **Auto Detect Schema**: Instantly generates a JSON schema for prompt inputs.
    -   **Auto Generate Name**: AI suggests creative names based on your prompt text.
    -   **Auto Format**: Cleans up and structures raw prompt text into dot-prompt syntax.
4.  **Discovery & Navigation**:
    -   **Infinite Scroll**: Smoothly load more templates as you scroll.
    -   **Filtering**: Filter templates by tags/labels to find specific categories.
    -   **Social**: "Like" functionality for both Templates and Executions.
5.  **Template Execution**:
    -   **Run**: Select a template, provide inputs (supports auto-fill), and execute.
    -   **Mixed Media Gallery**: View results as Images or Text Cards in a unified gallery.
    -   **Original Size View**: Click results to view high-resolution originals.

## Roadmap (To-Do)

-   [x] **Result Storage**: Store generated images in **Firebase Cloud Storage** and metadata in **Firestore**.
-   [x] **Public Access Control**: Basic boolean flag (`public`) implementation.
-   [x] **Creation History**: Mixed Media Gallery for past executions.
-   [x] **AI Parameter Generation**: "Dice" button for random valid inputs.
-   [x] **Ownership Protection**: Secure CRUD operations.
-   [x] **Social Interactions**: Likes for prompts and results.
-   [x] **AI Labeling**: Auto-generating tags for prompts.
-   [x] **AI Template Assistance**: Helper tools in the editor (Schema, Name, Format).
-   [x] **Pagination**: Implemented as Infinite Scroll.
-   [x] **Advanced Filtering**: Tag-based filtering.
-   [x] **UI Polish**: Firebase Theme integration (Red/Yellow/Dark Mode).