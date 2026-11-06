using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Api.Controllers;

[ApiController]
[Authorize(Policy = "TUTOR")]
[Route("tutors/me/matched-posts")]
public sealed class TutorMatchedPostsSseController(
    ICurrentUser currentUser,
    IDemandMatchingStore store,
    ISseNotificationPublisher ssePublisher) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [HttpGet("stream")]
    public async Task Stream(CancellationToken cancellationToken)
    {
        if (currentUser.UserId is not { } userId)
        {
            Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }

        var tutorProfileId = await store.GetApprovedTutorProfileIdForUserAsync(userId, cancellationToken);
        if (!tutorProfileId.HasValue)
        {
            Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }

        Response.StatusCode = StatusCodes.Status200OK;
        Response.Headers.ContentType = "text/event-stream; charset=utf-8";
        Response.Headers.CacheControl = "no-cache, no-store";
        Response.Headers.Connection = "keep-alive";
        Response.Headers["X-Accel-Buffering"] = "no";

        await Response.Body.FlushAsync(cancellationToken);

        // 1. Replay missed events if Last-Event-ID header is provided
        if (Request.Headers.TryGetValue("Last-Event-ID", out var lastEventIdValues))
        {
            var lastEventId = lastEventIdValues.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(lastEventId))
            {
                var replayEvents = await ssePublisher.GetReplayEventsAfterAsync(
                    tutorProfileId.Value,
                    lastEventId,
                    cancellationToken);

                foreach (var replay in replayEvents)
                {
                    await WriteSseEventAsync(replay, cancellationToken);
                }
            }
        }

        // 2. Subscribe before flushing the initial heartbeat so no live events are missed
        await using var enumerator = ssePublisher
            .SubscribeAsync(tutorProfileId.Value, cancellationToken)
            .GetAsyncEnumerator(cancellationToken);

        var moveNextTask = enumerator.MoveNextAsync().AsTask();

        // 3. Write initial comment heartbeat so the client stream opens immediately
        await WriteRawAsync(": connected\n\n", cancellationToken);

        // 4. Stream live events as they arrive
        while (await moveNextTask)
        {
            await WriteSseEventAsync(enumerator.Current, cancellationToken);
            moveNextTask = enumerator.MoveNextAsync().AsTask();
        }
    }

    private async Task WriteSseEventAsync(SsePostMatchedEvent sseEvent, CancellationToken cancellationToken)
    {
        var json = JsonSerializer.Serialize(sseEvent.Payload, JsonOptions);
        var frame = $"event: post_matched\nid: {sseEvent.EventId}\ndata: {json}\n\n";
        await WriteRawAsync(frame, cancellationToken);
    }

    private async Task WriteRawAsync(string text, CancellationToken cancellationToken)
    {
        var bytes = Encoding.UTF8.GetBytes(text);
        await Response.Body.WriteAsync(bytes, cancellationToken);
        await Response.Body.FlushAsync(cancellationToken);
    }
}
