import express from "express";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/auth/url", (req, res) => {
    const redirectUri = req.query.redirectUri as string;
    const params = new URLSearchParams({
      client_id: process.env.DROPBOX_CLIENT_ID || "",
      redirect_uri: redirectUri,
      response_type: "code",
      state: redirectUri,
    });
    res.json({
      url: `https://www.dropbox.com/oauth2/authorize?${params.toString()}`,
    });
  });

  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code, state } = req.query;
    const redirectUri = state as string;

    if (!code) {
      res.send("No code provided");
      return;
    }

    try {
      const tokenResponse = await fetch(
        "https://api.dropboxapi.com/oauth2/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${process.env.DROPBOX_CLIENT_ID}:${process.env.DROPBOX_CLIENT_SECRET}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            code: code as string,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
          }),
        },
      );

      const data = await tokenResponse.json();

      if (data.access_token) {
        res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${data.access_token}' }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <p>Authentication successful. This window should close automatically.</p>
            </body>
          </html>
        `);
      } else {
        res.send(`Authentication failed: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      res.send(`Error: ${error}`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
