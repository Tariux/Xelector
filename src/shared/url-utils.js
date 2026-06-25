function parseUrl(url) {
  try {
    return new URL(url);
  } catch (error) {
    throw new Error('Invalid URL: ' + url);
  }
}

function wildcardToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp('^' + escaped + '$', 'i');
}

function matchesRule(rule, url) {
  const parsed = typeof url === 'string' ? parseUrl(url) : url;
  const host = parsed.hostname.toLowerCase();
  const fullUrl = parsed.toString();

  if (rule.matchType === 'exact-domain') {
    return host === rule.pattern.toLowerCase();
  }

  if (rule.matchType === 'wildcard-domain') {
    return wildcardToRegExp(rule.pattern.toLowerCase()).test(host);
  }

  if (rule.matchType === 'url-prefix') {
    return fullUrl.indexOf(rule.pattern) === 0;
  }

  if (rule.matchType === 'regex') {
    return new RegExp(rule.pattern).test(fullUrl);
  }

  return false;
}

function specificity(rule) {
  if (rule.matchType === 'url-prefix') {
    return 4000 + rule.pattern.length;
  }

  if (rule.matchType === 'exact-domain') {
    return 3000 + rule.pattern.length;
  }

  if (rule.matchType === 'wildcard-domain') {
    return 2000 + rule.pattern.length;
  }

  if (rule.matchType === 'regex') {
    return 1000 + rule.pattern.length;
  }

  return 0;
}

module.exports = {
  matchesRule: matchesRule,
  parseUrl: parseUrl,
  specificity: specificity
};
