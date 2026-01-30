/**
 * Slack Notification Edge Function — User Feedback
 * ==================================================
 * Sends Slack notifications when users submit feedback.
 *
 * Setup:
 * 1. Deploy: supabase functions deploy slack-notify-feedback --project-ref zpfkvhnfbbimsfghmjiz
 * 2. Uses same SLACK_WEBHOOK_URL secret as route request function
 * 3. Trigger: DB trigger on user_feedback table (INSERT)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL') ?? '';

interface FeedbackPayload {
  type: 'INSERT';
  table: 'user_feedback';
  record: {
    id: string;
    device_id: string;
    feedback_type: 'bug' | 'missing_content' | 'suggestion';
    test_center_name: string | null;
    message: string;
    created_at: string;
  };
}

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  bug: 'Bug Report',
  missing_content: 'Missing Content',
  suggestion: 'Suggestion',
};

serve(async (req) => {
  try {
    const payload: FeedbackPayload = await req.json();

    // Only process INSERT events on user_feedback table
    if (payload.type !== 'INSERT' || payload.table !== 'user_feedback') {
      return new Response('Ignored', { status: 200 });
    }

    // Check if Slack webhook is configured
    if (!SLACK_WEBHOOK_URL) {
      console.error('SLACK_WEBHOOK_URL not configured');
      return new Response('Slack webhook not configured', { status: 200 });
    }

    const { record } = payload;

    // Truncate message for Slack preview
    const messagePreview = record.message.length > 200
      ? record.message.substring(0, 200) + '...'
      : record.message;

    const typeLabel = FEEDBACK_TYPE_LABELS[record.feedback_type] ?? record.feedback_type;

    // Build Slack message with blocks
    const message = {
      text: `New User Feedback: ${typeLabel}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'New User Feedback!',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Type:*\n${typeLabel}`,
            },
            {
              type: 'mrkdwn',
              text: `*Test Centre:*\n${record.test_center_name ?? 'Not specified'}`,
            },
            {
              type: 'mrkdwn',
              text: `*Time:*\n${new Date(record.created_at).toLocaleString('en-GB')}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message:*\n${messagePreview}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: 'Test Routes Expert | User Feedback',
            },
          ],
        },
      ],
    };

    // Send to Slack
    const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!slackResponse.ok) {
      throw new Error(`Slack webhook failed: ${slackResponse.status}`);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response('Error', { status: 500 });
  }
});
