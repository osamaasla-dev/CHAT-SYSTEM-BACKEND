import { Injectable, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

@Injectable()
export class FrontendRedirectService {
  private readonly logger = new Logger(FrontendRedirectService.name);

  redirect(response: FastifyReply, baseUrl: string | undefined) {
    if (!baseUrl || response.sent) {
      return;
    }

    try {
      const target = new URL(baseUrl);
      const targetUrl = target.toString();
      const escapedUrl = targetUrl.replace(/"/g, '&quot;');
      const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Redirecting...</title>
    <meta http-equiv="refresh" content="0;url=${escapedUrl}" />
    <script>
      try {
        window.location.href = ${JSON.stringify(targetUrl)};
      } catch (err) {
        console.error('Failed to redirect automatically', err);
      }
    </script>
    <style>
      body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      .card { text-align: center; }
      .url { word-break: break-all; color: #555; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Redirecting...</h1>
      <p>If you are not redirected automatically, <a href="${escapedUrl}">click here</a>.</p>
      <p class="url">${escapedUrl}</p>
    </div>
  </body>
</html>`;

      response
        .status(200)
        .header('Cache-Control', 'no-store')
        .type('text/html')
        .send(html);
      this.logger.log('redirected to frontend via HTML bridge', targetUrl);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.warn('Invalid FRONTEND_REDIRECT_URL, skipping redirect', err);
    }
  }
}
