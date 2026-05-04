import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  noindex?: boolean;
  type?: 'website' | 'article';
  keywords?: string[];
}

const DEFAULT_TITLE = 'Qpixa - High Quality AI Image Generation & Marketplace';
const DEFAULT_DESCRIPTION = 'Create, share, and discover amazing AI-generated images with Qpixa. The ultimate marketplace for AI prompts and art.';
const DEFAULT_IMAGE = 'https://www.qpixa.in/og-image.png'; // Fallback image
const SITE_URL = 'https://www.qpixa.in';

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image,
  canonical,
  noindex = false,
  type = 'website',
  keywords = []
}) => {
  const fullTitle = title ? `${title} | Qpixa` : DEFAULT_TITLE;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaImage = image || DEFAULT_IMAGE;
  const fullCanonical = canonical ? `${SITE_URL}${canonical}` : SITE_URL;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow" />}
      <link rel="canonical" href={fullCanonical} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:site_name" content="Qpixa" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
};
