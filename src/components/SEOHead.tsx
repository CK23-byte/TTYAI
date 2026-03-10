import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  title: string
  description: string
  path?: string
  ogImage?: string
  type?: string
  jsonLd?: object
}

const BASE_URL = 'https://talktoyouai.com'

export default function SEOHead({ title, description, path = '', ogImage, type = 'website', jsonLd }: SEOHeadProps) {
  const fullTitle = `${title} | TalkToYouAI`
  const url = `${BASE_URL}${path}`
  const image = ogImage || `${BASE_URL}/og-image.png`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="TalkToYouAI" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}
