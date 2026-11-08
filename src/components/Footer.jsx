import Stage from './Stage.jsx'
import Icon from './Icon.jsx'
import { copyText } from '../utils/clipboard.js'
import { coupleNames, formatContent, invitationMetadata, invitationUrl } from '../utils/content.js'

export default function Footer({ data, notify }) {
  const { footer, wedding } = data
  const copy = async (value, successMessage) => {
    try {
      await copyText(value)
      notify(successMessage)
    } catch (error) {
      console.error('Copy failed.', error)
      notify('Your browser blocked copying. Please copy the text or address manually.')
    }
  }
  const share = async () => {
    const url = invitationUrl(wedding.websiteUrl, window.location.href)
    const metadata = invitationMetadata(data)
    if (navigator.share) {
      try {
        await navigator.share({ title: metadata.title, text: metadata.description, url })
        return
      } catch (error) {
        if (error.name === 'AbortError') return
        console.warn('Native sharing failed; trying to copy the invitation link.', error)
      }
    }
    await copy(url, footer.linkCopied)
  }
  return (
    <Stage id="footer" background={footer.background} label={footer.title}>
      <div className="upper-arch-zone reveal stagger-1">
        <span className="sacred-shloka" lang="hi">{footer.blessing}</span>
      </div>
      <div className="safe footer-safe">
        <div className="footer-center-content reveal stagger-2">
          <h2 className="footer-thank-you">{footer.title}</h2>
          <p className="footer-names">{coupleNames(data.couple)}</p>
          <button
            id="hashtagPill"
            className="hashtag-pill"
            type="button"
            aria-label={formatContent(footer.copyHashtagLabel, data)}
            onClick={() => void copy(wedding.hashtag, formatContent(footer.hashtagCopied, data))}
          >
            <span className="hashtag-text">{wedding.hashtag}</span>
            <span className="hashtag-copy-icon" aria-hidden="true">&#128203;</span>
          </button>
          <p className="footer-blessing-text">{footer.message}</p>
          <div className="footer-action-buttons">
            <button id="shareBtn" className="btn-footer-action" type="button" onClick={() => void share()}>
              <Icon name="share" />{footer.shareLabel}
            </button>
            <a href="#hero" className="btn-footer-action" id="backToTopBtn">
              <Icon name="up" />{footer.backToTopLabel}
            </a>
          </div>
        </div>
      </div>
      <div className="lower-center-zone reveal stagger-3">
        <span className="footer-credit">{footer.credit}</span>
      </div>
    </Stage>
  )
}
