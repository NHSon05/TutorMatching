using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Application.Messaging;

namespace TutorMatching.Api.Controllers;

[ApiController]
[Authorize]
[Route("conversations")]
public sealed class ConversationsController : ControllerBase
{
    private readonly IMessagingService _messagingService;

    public ConversationsController(IMessagingService messagingService)
    {
        _messagingService = messagingService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ConversationPageDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConversations(
        [FromQuery] string? cursor = null,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _messagingService.GetConversationsAsync(cursor, pageSize, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ConversationSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConversationById(
        Guid id,
        CancellationToken ct = default)
    {
        var result = await _messagingService.GetConversationByIdAsync(id, ct);
        if (result == null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Conversation not found or access denied."
            });
        }

        return Ok(result);
    }

    [HttpGet("{id:guid}/messages")]
    [ProducesResponseType(typeof(MessagePageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMessages(
        Guid id,
        [FromQuery] string? cursor = null,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _messagingService.GetMessagesAsync(id, cursor, pageSize, ct);
        if (result == null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Conversation not found or access denied."
            });
        }

        return Ok(result);
    }

    [HttpPost("{id:guid}/messages")]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> SendMessage(
        Guid id,
        [FromBody] SendMessageRequest request,
        CancellationToken ct = default)
    {
        var (message, conflict, replay, error) = await _messagingService.SendMessageAsync(id, request, ct);

        if (conflict)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Client message ID was already submitted with different content."
            });
        }

        if (error == "not_found")
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Conversation not found or access denied."
            });
        }

        if (error == "conversation_closed")
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Conversation is closed. Messages cannot be sent."
            });
        }

        if (error is "content_required" or "client_message_id_required")
        {
            return UnprocessableEntity(new ProblemDetails
            {
                Status = StatusCodes.Status422UnprocessableEntity,
                Title = error == "content_required" ? "Message content is required." : "Client message ID is required."
            });
        }

        if (error == "content_too_long")
        {
            return UnprocessableEntity(new ProblemDetails
            {
                Status = StatusCodes.Status422UnprocessableEntity,
                Title = "Message content exceeds 4000 characters limit."
            });
        }

        if (message == null)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Failed to send message."
            });
        }

        if (replay)
        {
            return Ok(message);
        }

        return CreatedAtAction(nameof(GetConversationById), new { id }, message);
    }

    [HttpPost("{id:guid}/read")]
    [ProducesResponseType(typeof(MarkReadResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkRead(
        Guid id,
        [FromBody] MarkReadRequest request,
        CancellationToken ct = default)
    {
        var result = await _messagingService.MarkReadAsync(id, request, ct);
        if (result == null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Conversation not found or access denied."
            });
        }

        return Ok(result);
    }
}
