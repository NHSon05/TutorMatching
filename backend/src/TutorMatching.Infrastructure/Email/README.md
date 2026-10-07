# Email adapters (T014)

`SmtpEmailSender` implements the Application `IEmailSender` port with MailKit. It sends
UTF-8 plain-text mail to the configured SMTP sandbox, without a protocol logger or any
logging of recipient, body, reset links or credentials. Each send owns its SMTP client.

Configuration (`backend/.env`, API running on the host):

```dotenv
Smtp__Host=localhost
Smtp__Port=1025
Smtp__FromAddress=no-reply@tutormatching.local
Smtp__UseTls=false
Smtp__TimeoutSeconds=15
```

Start local Mailpit with `docker compose --env-file backend/.env -f backend/compose.yaml up -d mailpit`.
Read captured development mail at `http://localhost:8025`. If the API is later containerized
on the same Compose network, use `mailpit` as the SMTP host instead of `localhost`.

`UseTls=true` requires STARTTLS and normal certificate verification; it never silently
downgrades. The default Mailpit container does not enable TLS, so local sandbox settings
use false. SMTP authentication/implicit TLS and production-provider integration are outside
this sandbox adapter's scope. Timeout is a total connect/send deadline (1–120 seconds).

Invalid input is rejected without echoing supplied values. Caller cancellation propagates.
Transport/protocol/TLS failures produce `EmailDeliveryException` with no original server
text or inner exception, since those can contain addresses or tokens. Delivery is not retried
automatically: failure can mean the server accepted a message but the acknowledgement was lost.
After acceptance, the client closes without QUIT to avoid treating a cleanup failure as a send failure.

`CapturedEmailSender` is the test adapter. It stores messages in a concurrent queue, exposes
a snapshot and `Clear()`, and redacts `CapturedEmail.ToString()`. It validates the same input
and honors cancellation. Never log its message properties. Normal DI registers SMTP only;
`ApiWebApplicationFactory` substitutes its own capture instance, so tests do not send mail.

Verification: `EmailAdapterTests` covers capture/concurrency/reset, safe input errors and
cancellation. `SmtpSandboxTests` starts a dedicated temporary Mailpit container, verifies
actual SMTP delivery via its HTTP API, and rejects required TLS against the plaintext sandbox.
Run with Docker available:

```sh
dotnet test backend/tests/TutorMatching.Api.IntegrationTests/TutorMatching.Api.IntegrationTests.csproj --filter FullyQualifiedName~Email
```
