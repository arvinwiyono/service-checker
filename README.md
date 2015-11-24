# service-checker

service-checker.js requires *config.json*. For example:
```json
{
  "request_type": "access_token",
  "env": "dev",
  "hipchat_auth_token": "CFHafwPERZZXqweUmfasdPOL",
  "room_id": "123533",
  "auth": "XYZ",
  "resource_id": "12344085"
}
```
- *request_type* value must be either 'access_token' or 'login_page'
- *auth* and *resource_id* does not need to be included if request type equals to 'login_page'
- *env* will be set to 'dev' if not supplied
