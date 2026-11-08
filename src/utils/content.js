export function coupleNames(couple) {
  return `${couple.groom.name} & ${couple.bride.name}`
}

export function formatContent(template, data) {
  const values = {
    couple: coupleNames(data.couple),
    groom: data.couple.groom.name,
    bride: data.couple.bride.name,
    date: data.wedding.displayDate,
    city: data.wedding.city,
    hashtag: data.wedding.hashtag,
  }
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Unknown content placeholder: {${key}}`)
    return values[key]
  })
}

export function invitationMetadata(data) {
  return {
    title: formatContent(data.site.title, data),
    description: formatContent(data.site.description, data),
    image: data.wedding.websiteUrl
      ? new URL(data.hero.background.src, data.wedding.websiteUrl).href
      : data.hero.background.src,
  }
}

export function invitationUrl(configuredUrl, currentUrl) {
  const url = new URL(configuredUrl || currentUrl)
  url.hash = ''
  if (!configuredUrl) url.search = ''
  return url.href
}
