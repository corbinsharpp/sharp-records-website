import { authOrigin, cmsBranch, renderCmsConfig } from "../_lib/origin.js";

export async function onRequest({ request, env }) {
  const templateUrl = new URL("/admin/decap-config.yml", request.url);
  const asset = await env.ASSETS.fetch(new Request(templateUrl.toString(), { method: "GET" }));
  if (!asset.ok) {
    return new Response("Dashboard configuration is missing.", { status: 500 });
  }
  const yaml = renderCmsConfig(await asset.text(), {
    origin: authOrigin(request, env),
    branch: cmsBranch(env),
  });
  return new Response(yaml, {
    headers: {
      "content-type": "text/yaml; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
