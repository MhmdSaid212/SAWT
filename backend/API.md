# SAWT API

## Parent & Child Management

### Parent Profile
- `POST /parents/profile` — Create parent profile
- Requires: `parent` role

### Children
- `POST /children/` — Create child
- `GET /children/` — List authenticated parent's children
- `GET /children/{child_id}` — Get child details
- Requires: `parent` role

### Authorization
- Parents can only access their own children.
- Therapists and other roles cannot access parent/child endpoints.