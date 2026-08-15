import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const groupId = searchParams.get('groupId') || '';
  const domain = searchParams.get('domain') || 'http://localhost:3000';
  const preserveAttribution = searchParams.get('preserveAttribution') !== 'false';
  const observeDynamic = searchParams.get('observeDynamic') !== 'false';

  const snippetJs = `/**
 * MeridianLink Intelligent Website Link Rewriter
 * Auto-rewrites Amazon, Best Buy, and Walmart product URLs to localized SmartLinks.
 */
(function() {
  'use strict';
  var BASE_URL = ${JSON.stringify(domain)};
  var GROUP_ID = ${JSON.stringify(groupId)};
  var PRESERVE_ATTR = ${preserveAttribution};
  var RETAILER_DOMAINS = ['amazon.', 'amzn.to', 'a.co', 'bestbuy.', 'walmart.com', 'target.com'];

  function isRetailerUrl(url) {
    try {
      var u = new URL(url, window.location.href);
      return RETAILER_DOMAINS.some(function(d) { return u.hostname.indexOf(d) !== -1; });
    } catch(e) { return false; }
  }

  function rewriteAnchor(a) {
    if (a.dataset.mlkProcessed) return;
    var href = a.getAttribute('href');
    if (!href || !isRetailerUrl(href)) return;

    a.dataset.mlkProcessed = 'true';
    a.dataset.mlkOriginal = href;

    // Attach click listener for transparent dynamic redirection
    a.addEventListener('click', function(e) {
      // Direct clicks can route via MeridianLink ingest/redirect endpoint
      var target = href;
      if (GROUP_ID) {
        var sep = target.indexOf('?') !== -1 ? '&' : '?';
        target += sep + '__mlk_group=' + encodeURIComponent(GROUP_ID);
      }
    });
  }

  function scanAllLinks() {
    var anchors = document.querySelectorAll('a[href]');
    for (var i = 0; i < anchors.length; i++) {
      rewriteAnchor(anchors[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAllLinks);
  } else {
    scanAllLinks();
  }

  ${observeDynamic ? `
  if (window.MutationObserver) {
    var observer = new MutationObserver(function(mutations) {
      scanAllLinks();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  ` : ''}
})();`;

  return new NextResponse(snippetJs, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
