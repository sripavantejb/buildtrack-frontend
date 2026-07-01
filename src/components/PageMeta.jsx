import { useEffect } from 'react';
import { SITE, formatPageTitle, absoluteUrl } from '../config/siteMeta';

const META_ATTRS = {
  description: { name: 'description' },
  'og:title': { property: 'og:title' },
  'og:description': { property: 'og:description' },
  'og:image': { property: 'og:image' },
  'og:url': { property: 'og:url' },
  'og:site_name': { property: 'og:site_name' },
  'og:type': { property: 'og:type' },
  'og:locale': { property: 'og:locale' },
  'twitter:card': { name: 'twitter:card' },
  'twitter:title': { name: 'twitter:title' },
  'twitter:description': { name: 'twitter:description' },
  'twitter:image': { name: 'twitter:image' },
};

function upsertMeta(key, content) {
  const attrs = META_ATTRS[key];
  if (!attrs) return;

  const selector = attrs.property
    ? `meta[property="${attrs.property}"]`
    : `meta[name="${attrs.name}"]`;

  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    if (attrs.property) tag.setAttribute('property', attrs.property);
    if (attrs.name) tag.setAttribute('name', attrs.name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

export default function PageMeta({
  title,
  description = SITE.description,
  image = SITE.ogImage,
  path = '/',
  type = 'website',
  noIndex = false,
}) {
  useEffect(() => {
    const pageTitle = formatPageTitle(title);
    const pageDescription = description || SITE.description;
    const pageUrl = absoluteUrl(path);
    const pageImage = image.startsWith('http') ? image : absoluteUrl(image);

    document.title = pageTitle;

    upsertMeta('description', pageDescription);
    upsertMeta('og:title', pageTitle);
    upsertMeta('og:description', pageDescription);
    upsertMeta('og:image', pageImage);
    upsertMeta('og:url', pageUrl);
    upsertMeta('og:site_name', SITE.name);
    upsertMeta('og:type', type);
    upsertMeta('og:locale', SITE.locale);
    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', pageTitle);
    upsertMeta('twitter:description', pageDescription);
    upsertMeta('twitter:image', pageImage);
    upsertLink('canonical', pageUrl);

    let robotsTag = document.head.querySelector('meta[name="robots"]');
    if (noIndex) {
      if (!robotsTag) {
        robotsTag = document.createElement('meta');
        robotsTag.setAttribute('name', 'robots');
        document.head.appendChild(robotsTag);
      }
      robotsTag.setAttribute('content', 'noindex, nofollow');
    } else if (robotsTag) {
      robotsTag.setAttribute('content', 'index, follow');
    }
  }, [title, description, image, path, type, noIndex]);

  return null;
}
