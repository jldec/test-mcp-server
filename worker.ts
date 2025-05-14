import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export type Env = {
  MCP_OBJECT: DurableObjectNamespace<McpAgent>;
};

export class TestMcpAgent extends McpAgent {
  server = new McpServer(
    { name: "test-server", version: "1.0.0" },
    { capabilities: { logging: {} } }
  );

  async init() {
    this.server.tool(
      "greet",
      "A simple greeting tool",
      { name: z.string().describe("Name to greet") },
      async ({ name }): Promise<CallToolResult> => {
        return { content: [{ type: "text", text: `Hello, ${name}! ${new Date().toLocaleTimeString()}` }] };
      }
    );
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const path = new URL(request.url).pathname;

    if (path === "/") {
      return new Response("test-mcp-server listening on /sse and /mcp");
    }

    if (path === "/sse" || path === "/sse/message") {
      return TestMcpAgent.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (path === "/mcp") {
      return TestMcpAgent.serve("/mcp").fetch(request, env, ctx);
    }

    if (path === "/echo") {
      return Response.json({
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        body: request.body ? await request.text() : null,
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
