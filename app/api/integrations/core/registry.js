import ShopifyAdapter from "../adapters/shopify.adapter";
import YouCanAdapter from "../adapters/youcan.adapter";
import WooAdapter from "../adapters/woocommerce.adapter";
import AramexAdapter from "../adapters/aramex.adapter";
import GoogleSheetsAdapter from "../adapters/googleSheets.adapter";
import WooCommerceAdapter from "../adapters/woocommerce.adapter";

const registry = {
  shopify: new ShopifyAdapter(),
  youcan: new YouCanAdapter(),
  woocommerce: new WooAdapter(),
  aramex: new AramexAdapter(),
  google_sheets: new GoogleSheetsAdapter(),
  woocommerce: new WooCommerceAdapter(),

};

export function getAdapter(slug) {
  const adapter = registry[slug];

  if (!adapter) {
    throw new Error(`No adapter for ${slug}`);
  }

  return adapter;
}