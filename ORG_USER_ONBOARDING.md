# Organization User Onboarding

This project currently uses one organization per user account and enforces org-level isolation through `org_members` and `org_id`.

## Who Can Create Staff Accounts

- Only organization members with role `owner` or `admin` can create users for their organization.
- Supported managed roles: `operator`, `driver`, `admin`.

## API You Can Use Today

The backend endpoint is:

- `POST /api/org-users/create`

Request body:

```json
{
  "email": "new.operator@company.com",
  "fullName": "New Operator",
  "role": "operator"
}
```

Allowed `role` values:

- `operator`
- `driver`
- `admin`

Behavior:

1. Verifies the currently authenticated user belongs to an organization.
2. Verifies the caller is `owner` or `admin` in that org.
3. Creates the user directly in Supabase Auth with the password set by the admin.
4. Upserts profile data in `profiles` with requested role.
5. Upserts org membership in `org_members` for the caller's organization.

## Example (browser session cookie)

```bash
curl -X POST http://localhost:3000/api/org-users/create \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-auth-cookie>" \
  -d '{"email":"driver.one@company.com","fullName":"Driver One","role":"driver","password":"TempPass123"}'
```

## Role-Specific Notes

- `operator`: can access normal operations screens per your app role checks.
- `driver`: can sign in as a driver role; then create the driver profile record in the Drivers module (license/passport/vehicle assignment).
- `admin`: organization-level admin. This is how orgs create additional admins without self-signup.

## Current Signup Flow

- Public signup page is intended for self-signup (`operator` or `driver`) only.
- To avoid accidental cross-org self-created workspaces for staff, prefer creating staff through `POST /api/org-users/create`.
- Staff created by admins should log in with the email and password provided to them by the organization admin.

## Password Reset

- Admins can send a password reset link from the Employees screen.
- Reset links redirect to `https://nexuslogistic.netlify.app/login`.