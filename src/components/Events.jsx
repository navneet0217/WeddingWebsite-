import { Fragment } from 'react'
import Stage from './Stage.jsx'
import Image from './Image.jsx'
import Icon from './Icon.jsx'

export default function Events({ config }) {
  return (
    <Stage id="events" label={config.title}>
      <div className="safe events-safe">
        <div className="events-header reveal stagger-1">
          <h2 className="section-title">{config.title}</h2>
          <p className="safe-caption">{config.description}</p>
        </div>
        <div className="events-timeline-container" id="eventsTimeline">
          {config.items.map((event, index) => (
            <Fragment key={event.id}>
              <article className={`event-timeline-card reveal stagger-${index % 3 + 1}${event.featured ? ' grand-wedding-card' : ''}`}>
                <div className={`event-card-box${event.featured ? ' grand-box' : ''}`}>
                  {event.featured && <div className="grand-crown-ribbon">{event.highlightLabel}</div>}
                  <div className={`event-art-frame${event.featured ? ' grand-art-frame' : ''}`}>
                    <Image {...event.image} className="event-art-img" loading="lazy" />
                    <div className={`event-day-pill${event.featured ? ' grand-pill' : ''}`}>{event.dayLabel}</div>
                  </div>
                  <div className="event-info-pane">
                    <h3 className={`event-ceremony-title${event.featured ? ' grand-title' : ''}`}>{event.name}</h3>
                    <div className={`event-datetime-badge${event.featured ? ' grand-time-badge' : ''}`}>
                      <Icon name="clock" size={13} />
                      <span>{event.displayDate}{event.time && ` \u2022 ${event.time}`}</span>
                    </div>
                    <div className="event-meta-box">
                      <div className="meta-row venue-row">
                        <Icon name="location" size={14} /><span>{event.venue}</span>
                      </div>
                      {event.address && <p className="event-address">{event.address}</p>}
                    </div>
                    {event.mapUrl && (
                      <a className="event-map" href={event.mapUrl} target="_blank" rel="noopener noreferrer">
                        <Icon name="location" size={14} />{config.mapLabel}
                      </a>
                    )}
                  </div>
                </div>
              </article>
              <div className="event-floral-divider" aria-hidden="true">
                <Image {...config.divider} className="event-divider-img" loading="lazy" />
              </div>
            </Fragment>
          ))}
        </div>
      </div>
      <div className="events-merger-divider bottom-merger" aria-hidden="true">
        <Image {...config.merger} className="merger-divider-img" />
      </div>
    </Stage>
  )
}
