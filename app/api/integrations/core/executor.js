import { getAdapter } from "./registry";

export async function runIntegrationAction({
  slug,
  action,
  connection,
  payload,
}) {
  const adapter = getAdapter(slug);

  if (!adapter[action]) {
    throw new Error(`Action ${action} not supported`);
  }

  return await adapter[action](payload, connection);
}