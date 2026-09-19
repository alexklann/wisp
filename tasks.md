# Roadmap:
- User Editing (bio, profile picture, display name, password)
- File Management (admin panel or per-server [guilded like])
    - Allow for a specific frontend page / module that shows all uploaded files / images / videos to a server
    - Allows for easy administration and deletion of old images / videos
- Emojis
- Pinned Messages
    - Add new flag to message in database `pinned: 0/1`
    - Add small popup that shows all pinned messages
- Reactions
- Forums
- Commands
    - /ai [model_id] [prompt]
    - /ctx - Allow for creation of different contexts
- Search

## Feature: Context
A context is a specific color highlighting of a message.
A context is used to mark specific messages that belong to a different context.
This allows for quick visual parsing of messages that belong to the same message context.

E.g.: two users are having a conversation
User A: [ctx1] Did you hear about that new Kanye West album?
User A: /ctx 2
User A: [ctx2] Omg I saw this super cute cat today
User A: /ctx 1
User A: [ctx1] The new songs are so good

-- As you can see, User A used two context's to talk about different things in their messages:
- context 1 is about the new album of a big musician
- context 2 is about the cat they saw today
-- User B can now reply to these messages by also using context's.

User B: /ctx 2
User B: [ctx2] aww, what color?
User B: /ctx 1
User B: [ctx1] I actually listen to Tyler, the Creator more.
User B: [ctx1] but good for him

-- The [ctxn] is only a placeholder to indicate different context's.
-- Visually, this will be displayed using different message background colors or small tag indicators.


# Needs re-thinking / fixing / refactoring:

**Re-thinking**:
- Message Pagination + Paginated Loading with Virtuoso
    - Currently, this is super jittery and ugly looking.
    - Maybe go with a flex-col-reverse list? *requires major refactoring*

**Refactor**:
- Move "join server" button into "create server" modal