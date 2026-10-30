# AI Complaint Management System
## Software Requirements Specification

**Version:** 1.0  
**Prepared:** 29 October 2026  
**Basis:** Current repository implementation and project documentation

## 1. Purpose and scope

The AI Complaint Management System provides a web application for submitting and tracking e-commerce complaints. It uses machine-learning predictions to categorize and prioritize complaints, maps categories to departments, calculates service-level agreement (SLA) deadlines, and supports staff assignment, resolution, escalation monitoring, and administrative reporting.

This specification records both the behavior evidenced in the repository and requirements or deployment details that are not established by the code. “Implemented” means a corresponding implementation was found; it does not imply production readiness or independent validation.

## 2. Stakeholders and roles

| Role | Responsibilities evidenced in the application |
|---|---|
| User | Register or sign in, submit complaints, and view their own complaints and status. |
| Department Staff | View complaints assigned to their account, filter/search them, and update status or resolve them. |
| Admin | View system complaints and dashboards, override AI results, assign or reassign complaints, promote accounts to staff, and view staff and analytics screens. |

Roles are represented by `User`, `Department Staff`, and `Admin`. Public registration accepts a role from the request; an explicit trusted-admin provisioning process is not present in the repository and should be defined before production use.

## 3. Product context and architecture

The system has a React single-page web client, a FastAPI REST API, a SQLAlchemy persistence layer, and an in-process Python ML prediction module. The browser calls the API directly; the model is loaded by the backend rather than exposed as a separate model-serving service.

```text
Browser (React/Vite)
  └── HTTP/JSON + bearer JWT ──> FastAPI
                                  ├── SQLAlchemy ──> SQLite by default
                                  └── Python prediction module
                                      ├── sentence-transformer encoder
                                      ├── category classifier
                                      └── sentiment/urgency priority classifier

Standalone SLA monitor ──> database (when run separately)
```

### Technology stack

| Layer | Technologies found in the repository |
|---|---|
| Frontend | React 19, React DOM, React Router 7, Vite 8, JavaScript ES modules, Recharts, Lucide React, Oxlint. |
| Backend/API | Python, FastAPI, Uvicorn, Pydantic, SQLAlchemy. |
| Authentication | OAuth2 password-form login, JWT using `python-jose`, bcrypt password hashing through Passlib/bcrypt. |
| Persistence | SQLite by default; `DATABASE_URL` can override the SQLAlchemy URL. The Compose file defines PostgreSQL 15, but the application does not select it by default. |
| Machine learning/NLP | scikit-learn, Sentence Transformers, PyTorch/transformer dependencies, NumPy, pandas, joblib, NLTK, VADER Sentiment. |
| Deployment/configuration | Local Windows development instructions in the root README; Docker Compose currently defines only a PostgreSQL service. |

The root README documents Python 3.12 and Node.js 20.19+ or 22.12+ for local development. Backend dependency versions are mostly unpinned; scikit-learn is pinned to 1.6.1 and bcrypt to 4.0.1. Frontend versions are declared in `frontend/package.json`.

## 4. Functional requirements

| ID | Requirement | Current state |
|---|---|---|
| FR-01 | The system shall allow a person to register with a unique username, password, and role, and shall reject duplicate usernames. | Implemented. Registration currently accepts the role from the client request. |
| FR-02 | The system shall authenticate users and issue a bearer access token on successful login. It shall reject invalid credentials and expired/invalid tokens. | Implemented; access tokens expire after 30 minutes. |
| FR-03 | The system shall store passwords as hashes and shall not return password hashes in user API responses. | Implemented through bcrypt hashing and response schemas that omit the hash. |
| FR-04 | An authenticated user shall be able to submit complaint text and view their own complaint records. | Implemented. The complaint text is stored before prediction. The API does not enforce a submission-length limit. |
| FR-05 | On submission, the system shall run AI classification and persist category, category confidence, priority, priority confidence, sentiment, urgency signals, and model version when prediction succeeds. | Implemented. Inference truncates its input to 1,000 characters, while the stored complaint text is not truncated by the API. |
| FR-06 | The system shall map predicted categories to operational departments. If category confidence is below 0.50, or prediction fails, the complaint shall be directed to manual review. | Implemented. Manual-review routing is `Admin / Manual Review`; the prediction module itself does not predict a department. |
| FR-07 | The system shall calculate an SLA deadline from priority: Critical = 4 hours; High = 24 hours; Medium = 72 hours; Low = 7 days. | Implemented. Unknown priorities fall back to 7 days. |
| FR-08 | Admins shall be able to assign unassigned complaints to staff and department, and reassign already assigned complaints. The system shall retain the previous assignee and reassignment time. | Implemented in the API and admin assignment interface. The API does not validate staff workload or enforce department matching. |
| FR-09 | Staff shall only see their assigned complaints and shall be able to move them between Pending and In Progress or mark them Resolved. | Implemented. Staff access is checked against the assigned user. Resolved complaints cannot be reopened through the staff status endpoint. |
| FR-10 | Admins shall be able to view complaints across users, override category, priority, and department, and have the SLA deadline recalculated for an overridden priority. | Implemented. |
| FR-11 | Admins shall be able to view complaint totals, status/priority/category distributions, resolution rate, and SLA-related indicators. | Implemented in the dashboard and analytics screens using the complaints returned by the API. |
| FR-12 | The system shall identify unresolved complaints whose SLA deadline has passed and mark them escalated. | Implemented by `backend/sla_monitor.py` as a standalone process that checks every 60 seconds. It must be started separately; the API and Compose configuration do not start it. |
| FR-13 | The system shall allow admins to list staff and change an account's department while promoting it to Department Staff. | Implemented through admin-only endpoints. |
| FR-14 | Users shall be able to sign out, and the browser shall clear the locally stored token. | Implemented in the dashboard client. |

### 4.1 Complaint lifecycle and data

The lifecycle states declared by the backend are **Pending**, **In Progress**, **Resolved**, and **Escalated**. Escalation is also recorded separately in `escalation_status`; the SLA monitor does not change the complaint's main `status`.

The principal persisted data includes:

- **User:** identifier, unique username, password hash, role, optional department.
- **Complaint:** identifier, submitting user, complaint text, AI category/priority and confidence scores, sentiment score, urgency signals, department, status, submission time, SLA deadline, escalation and resolution timestamps, model version, override-related fields, assignee, and reassignment information.

Complaint response schemas expose the complaint and prediction fields needed by the client, not the user's password hash. Database table creation is performed at API startup. A standalone SQLite migration script exists; a general versioned migration framework is not configured.

### 4.2 Main API surface

All paths below are served by the FastAPI application. Complaint and user operations other than registration and token creation require bearer authentication; role-specific authorization applies as described above.

| Method and path | Purpose |
|---|---|
| `POST /token` | Authenticate and issue an access token. |
| `POST /users/` | Register a user. |
| `GET /users/me/` | Return the authenticated user's profile. |
| `GET /users/all` | Admin: list users. |
| `GET /users/staff/` | Admin: list staff users. |
| `PUT /users/{user_id}/department` | Admin: set department and promote account to staff. |
| `POST /complaints/` | Submit a complaint and run prediction. |
| `GET /complaints/` | List complaints visible to the authenticated role; supports `skip` and `limit`. |
| `PUT /complaints/{complaint_id}/assign` | Admin: assign or reassign a complaint. |
| `PUT /complaints/{complaint_id}/override` | Admin: override category, priority, and department. |
| `PUT /complaints/{complaint_id}/status` | Assigned staff: update complaint status. |
| `PUT /complaints/{complaint_id}/resolve` | Admin or assigned staff: resolve a complaint. |

FastAPI's interactive API documentation is available at `/docs` when the service is running.

## 5. Machine-learning and NLP requirements

### 5.1 Inference behavior

1. Accept raw complaint text as a string, truncate the text used for inference to 1,000 characters, and return an error-shaped result for non-string, empty, whitespace-only, or otherwise failed inference.
2. Compute sentiment and urgency from the raw text before cleaning it.
3. Clean text for category classification: lowercase; remove URLs/email-like strings and punctuation; tokenize; remove English stopwords except negations; lemmatize; and discard one-character tokens.
4. Produce a category label and confidence, priority label and confidence, sentiment score, urgency signal list, model version, and status. Confidence values are intended to be floats in `[0, 1]`.
5. Never infer the department in the ML module; department mapping and low-confidence/manual-review routing belong to application logic.
6. Load model artifacts and the sentence-transformer encoder once when the prediction module is imported.

### 5.2 Model design and labels

| Prediction | Current implementation |
|---|---|
| Category | `all-MiniLM-L6-v2` sentence embeddings of cleaned text, followed by scikit-learn `LogisticRegression` with `max_iter=2000`, balanced class weights, and random seed 42. |
| Category labels | Delivery; Product Quality; Returns & Replacements; Payments & Refunds; Other. The training feature-preparation code maps source dataset categories into these five labels. |
| Priority | `LogisticRegression` over six numeric features: VADER compound sentiment plus five binary urgency flags. It does not use sentence embeddings. |
| Priority labels | Low, Medium, High, Critical. |
| Urgency flags | Refund demand; repeat issue; all caps; exclamation; urgency word. Flags are detected with fixed regular expressions over raw text. |
| Sentiment | VADER compound score, in the range `[-1, 1]`. |
| Version/artifacts | Inference reports model version `1.0`. Artifacts are loaded from `backend/ai_module/models/`, including category and priority estimators, urgency feature order, and encoder name. |

### 5.3 Training and evaluation

The training script reads `data/augmented_dataset.csv` relative to its working directory, cleans and featurizes the examples using the same shared preprocessing/feature functions as inference, and performs an 80/20 group split by `seed_text` (random seed 42) to avoid placing augmented variants of the same seed in both sets. It trains and evaluates category and priority classifiers separately, then saves the estimators, encoder metadata, feature order, and metrics.

The checked-in `training_metrics.json` reports:

| Model | Accuracy | Macro precision | Macro recall | Macro F1 |
|---|---:|---:|---:|---:|
| Category | 0.8244 | 0.8629 | 0.8305 | 0.8260 |
| Priority | 0.6317 | 0.6335 | 0.6528 | 0.6323 |

The metrics record 1,375 training rows, 353 test rows, and zero seed overlap. These are the recorded evaluation results for the checked-in model artifacts, not a production performance guarantee or a service-level target. Sample inference cases are provided under `backend/ai_module/tests/`.

### 5.4 ML operational requirements and limitations

- Training and inference must continue to use the same `clean_text`, sentiment, and urgency implementations to avoid feature skew.
- Model training is a developer/offline workflow; no in-product model retraining, feedback loop, model registry, or automated deployment is present.
- The sentence-transformer encoder may need to download the pretrained model on first startup; the root README also notes internet access may be required for model/NLTK setup.
- Confidence thresholding is implemented for category routing only (0.50). No priority confidence threshold or human feedback workflow is implemented.
- Training and runtime category labels/mappings should be kept aligned. The department mapping includes labels such as Seller Support and Account & Technical, although the current training category list is five labels; unmatched category values fall through to manual review.

## 6. User interface requirements

- The login experience presents User, Department Staff, and Admin portals and supports sign-in and sign-up.
- The user dashboard provides complaint submission and complaint tracking.
- The staff dashboard provides assigned-case search, status filtering, priority ordering, SLA visibility, and status updates.
- The admin dashboard provides summary cards, recent and all-complaint lists, search/filtering, category/priority/resolution charts, priority override, staff management, and assignment/reassignment screens.
- Admin and staff views refresh visible complaint data periodically; the client also refreshes on window focus.

The frontend is a Vite development/build application; a production hosting/CDN strategy is not specified in the repository.

## 7. Non-functional requirements and operational constraints

### 7.1 Implemented or documented constraints

- The local development environment documented by the project is Windows 10/11, Python 3.12, and Node.js 20.19+ or 22.12+.
- The default persistence configuration is a local SQLite database. `DATABASE_URL` allows a different SQLAlchemy connection string.
- CORS is configured for `http://localhost:5173` and `http://127.0.0.1:5173`.
- The complaints list defaults to `limit=100`; the dashboard analytics are therefore based on the records fetched by the client, not necessarily every record in a database exceeding that limit.
- The SLA monitor is separate from the API and needs an explicit process/supervisor to run continuously.
- Frontend build and lint commands are `npm run build` and `npm run lint`. The README documents an AI sample-case runner.

### 7.2 Production requirements to confirm

The repository does not establish measurable production targets for availability, latency, throughput, accessibility, backup/restore, retention, privacy, or ML quality. Before production acceptance, stakeholders should define targets for these areas and validate them under the intended deployment environment.

The following implementation details need explicit production decisions:

1. Replace the development JWT fallback secret with a securely managed deployment secret; define rotation and token-revocation expectations.
2. Restrict account role assignment and determine who may provision admins and staff.
3. Configure and test the intended database. The Compose file starts PostgreSQL, but the backend defaults to SQLite unless `DATABASE_URL` is set.
4. Define production CORS origins, application/API deployment, secrets management, database migrations, backups, logs, monitoring, and the SLA-monitor process lifecycle.
5. Define complaint-text length/validation, retention, privacy, and access/audit requirements.
6. Define model acceptance criteria, monitoring, review of low-confidence predictions, and a process for reviewing misclassification or unfair outcomes.

## 8. Acceptance criteria

The current implementation can be checked against the following functional acceptance scenarios:

1. A registered user can log in, receive a bearer token, submit a non-empty complaint, and retrieve that complaint from their own list.
2. A successful prediction stores category/priority outputs, confidence scores, sentiment, urgency signals, model version, mapped department, and an SLA deadline.
3. A category confidence below 0.50 routes the complaint to manual review; an inference error leaves the complaint pending and routes it to manual review.
4. A user cannot retrieve another user's complaints; staff can retrieve only complaints assigned to them; admin-only operations reject non-admin callers.
5. An admin can assign/reassign a complaint and can override its category, priority, or department. An override recalculates the SLA deadline from priority.
6. Assigned staff can update or resolve a complaint; an unassigned staff user cannot update it; a resolved complaint cannot be reopened through the staff status endpoint.
7. When the standalone SLA monitor runs, unresolved complaints past their deadline are marked escalated and receive an escalation timestamp.
8. The ML sample-case runner reports expected labels/signals and error behavior for its supplied cases.

## 9. Repository references

- [README.md](./README.md) — local setup, runtime versions, and developer commands.
- [backend/main.py](./backend/main.py) — API routes, authorization checks, prediction orchestration, department routing, and SLA assignment.
- [backend/models.py](./backend/models.py), [backend/schemas.py](./backend/schemas.py) — persistence entities, enums, and API schemas.
- [backend/auth.py](./backend/auth.py), [backend/database.py](./backend/database.py) — authentication and database configuration.
- [backend/services.py](./backend/services.py), [backend/sla_monitor.py](./backend/sla_monitor.py) — category routing, SLA calculation, and escalation monitoring.
- [backend/requirements.txt](./backend/requirements.txt) — backend and ML dependencies.
- [backend/ai_module/predict.py](./backend/ai_module/predict.py), [backend/ai_module/preprocess.py](./backend/ai_module/preprocess.py), [backend/ai_module/add_features.py](./backend/ai_module/add_features.py) — inference contract and feature pipeline.
- [backend/ai_module/train.py](./backend/ai_module/train.py), [backend/ai_module/models/training_metrics.json](./backend/ai_module/models/training_metrics.json) — training workflow and recorded evaluation metrics.
- [backend/ai_module/tests/sample_cases.json](./backend/ai_module/tests/sample_cases.json) — sample model behavior cases.
- [frontend/package.json](./frontend/package.json), [frontend/src/api.js](./frontend/src/api.js) — frontend dependencies and API client.
- [frontend/src/pages/](./frontend/src/pages/) — role dashboards and user workflows.
- [docker-compose.yml](./docker-compose.yml) — optional PostgreSQL service definition.
