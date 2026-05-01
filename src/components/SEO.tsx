"use client";
import React, { useEffect } from 'react';

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
  
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = fullTitle;
      
      // Update meta description
      let descMeta = document.querySelector('meta[name="description"]');
      if (descMeta) {
        descMeta.setAttribute('content', metaDescription);
      } else {
        descMeta = document.createElement('meta');
        descMeta.setAttribute('name', 'description');
        descMeta.setAttribute('content', metaDescription);
        document.head.appendChild(descMeta);
      }
    }
  }, [fullTitle, metaDescription]);

  return null; // Next.js handles head tags via metadata API in layout/page. This side effect is a fallback.
};
