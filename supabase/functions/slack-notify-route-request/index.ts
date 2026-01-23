/**
 * Slack Notification Edge Function
 * =================================
 * Sends Slack notifications when new route pack requests are submitted.
 *
 * Setup:
 * 1. Deploy: supabase functions deploy slack-notify-route-request --project-ref zpfkvhnfbbimsfghmjiz
 * 2. Set secret: supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
 * 3. Create Database Webhook in Supabase Dashboard:
 *    - Table: route_requests
 *    - Events: INSERT
 *    - URL: Edge Function URL
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL') ?? '';

interface RouteRequestPayload {
  type: 'INSERT';
  table: 'route_requests';
  record: {
    id: string;
    test_center_id: string;
    device_id: string;
    created_at: string;
  };
}

serve(async (req) => {
  try {
    const payload: RouteRequestPayload = await req.json();

    // Only process INSERT events on route_requests table
    if (payload.type !== 'INSERT' || payload.table !== 'route_requests') {
      return new Response('Ignored', { status: 200 });
    }

    // Check if Slack webhook is configured
    if (!SLACK_WEBHOOK_URL) {
      console.error('SLACK_WEBHOOK_URL not configured');
      return new Response('Slack webhook not configured', { status: 200 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch test center details
    const { data: testCenter } = await supabase
      .from('test_centers')
      .select('name, city')
      .eq('id', payload.record.test_center_id)
      .single();

    // Get total request count for this center
    const { count } = await supabase
      .from('route_requests')
      .select('*', { count: 'exact', head: true })
      .eq('test_center_id', payload.record.test_center_id);

    // Build Slack message with blocks
    const message = {
      text: `New Route Pack Request!`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'New Route Pack Request!',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Test Centre:*\n${testCenter?.name ?? 'Unknown'}`,
            },
            {
              type: 'mrkdwn',
              text: `*Location:*\n${testCenter?.city ?? 'Unknown'}`,
            },
            {
              type: 'mrkdwn',
              text: `*Total Requests:*\n${count ?? 1}`,
            },
            {
              type: 'mrkdwn',
              text: `*Time:*\n${new Date(payload.record.created_at).toLocaleString('en-GB')}`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: 'Test Routes Expert | Hot Spot Tracking',
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
