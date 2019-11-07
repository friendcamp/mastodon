import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import { isRtl } from '../rtl';
import { FormattedMessage } from 'react-intl';
import Permalink from './permalink';
import classnames from 'classnames';
import PollContainer from 'mastodon/containers/poll_container';
import Icon from 'mastodon/components/icon';
import { autoPlayGif } from 'mastodon/initial_state';
import { expandUsernames } from 'mastodon/initial_state';

const MAX_HEIGHT = 642; // 20px * 32 (+ 2px padding at the top)

export default class StatusContent extends React.PureComponent {

  static contextTypes = {
    router: PropTypes.object,
  };

  static propTypes = {
    status: ImmutablePropTypes.map.isRequired,
    expanded: PropTypes.bool,
    onExpandedToggle: PropTypes.func,
    onClick: PropTypes.func,
    collapsable: PropTypes.bool,
  };

  state = {
    hidden: true,
    collapsed: null, //  `collapsed: null` indicates that an element doesn't need collapsing, while `true` or `false` indicates that it does (and is/isn't).
  };

  _updateStatusLinks () {
    const node = this.node;

    if (!node) {
      return;
    }

    const links = node.querySelectorAll('a');

    for (var i = 0; i < links.length; ++i) {
      let link = links[i];
      if (link.classList.contains('status-link')) {
        continue;
      }
      link.classList.add('status-link');

      let mention = this.props.status.get('mentions').find(item => link.href === item.get('url'));

      if (mention) {
        link.addEventListener('click', this.onMentionClick.bind(this, mention), false);
        link.setAttribute('title', mention.get('acct'));
        if (expandUsernames) {
          if (mention.get('acct') === mention.get('username')) {
            link.innerHTML = `@<span class="fc-mention-local">${mention.get('username')}</span>`;
          } else {
            link.innerHTML = `@<span class="fc-mention-remote">${mention.get('acct')}</span>`;
          }
        }
      } else if (link.textContent[0] === '#' || (link.previousSibling && link.previousSibling.textContent && link.previousSibling.textContent[link.previousSibling.textContent.length - 1] === '#')) {
        link.addEventListener('click', this.onHashtagClick.bind(this, link.text), false);
      } else if (link.href && link.href.match(/\.mp3$/)) {
        link.innerHTML += `<p><audio class="fc-audio" controls src="${link.href}"></audio></p>`;
      } else {
        link.setAttribute('title', link.href);
        link.classList.add('unhandled-link');
      }

      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
    }

    if (
      this.props.collapsable
      && this.props.onClick
      && this.state.collapsed === null
      && node.clientHeight > MAX_HEIGHT
      && this.props.status.get('spoiler_text').length === 0
    ) {
      this.setState({ collapsed: true });
    }
  }

  _updateStatusEmojis () {
    const node = this.node;

    if (!node || autoPlayGif) {
      return;
    }

    const emojis = node.querySelectorAll('.custom-emoji');

    for (var i = 0; i < emojis.length; i++) {
      let emoji = emojis[i];
      if (emoji.classList.contains('status-emoji')) {
        continue;
      }
      emoji.classList.add('status-emoji');

      emoji.addEventListener('mouseenter', this.handleEmojiMouseEnter, false);
      emoji.addEventListener('mouseleave', this.handleEmojiMouseLeave, false);
    }
  }

  componentDidMount () {
    this._updateStatusLinks();
    this._updateStatusEmojis();
  }

  componentDidUpdate () {
    this._updateStatusLinks();
    this._updateStatusEmojis();
  }

  onMentionClick = (mention, e) => {
    if (this.context.router && e.button === 0 && !(e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.context.router.history.push(`/accounts/${mention.get('id')}`);
    }
  }

  onHashtagClick = (hashtag, e) => {
    hashtag = hashtag.replace(/^#/, '');

    if (this.context.router && e.button === 0 && !(e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.context.router.history.push(`/timelines/tag/${hashtag}`);
    }
  }

  handleEmojiMouseEnter = ({ target }) => {
    target.src = target.getAttribute('data-original');
  }

  handleEmojiMouseLeave = ({ target }) => {
    target.src = target.getAttribute('data-static');
  }

  handleMouseDown = (e) => {
    this.startXY = [e.clientX, e.clientY];
  }

  handleMouseUp = (e) => {
    if (!this.startXY) {
      return;
    }

    const [ startX, startY ] = this.startXY;
    const [ deltaX, deltaY ] = [Math.abs(e.clientX - startX), Math.abs(e.clientY - startY)];

    let element = e.target;
    while (element) {
      if (element.localName === 'button' || element.localName === 'a' || element.localName === 'label') {
        return;
      }
      element = element.parentNode;
    }

    if (deltaX + deltaY < 5 && e.button === 0 && this.props.onClick) {
      this.props.onClick();
    }

    this.startXY = null;
  }

  handleSpoilerClick = (e) => {
    e.preventDefault();

    if (this.props.onExpandedToggle) {
      // The parent manages the state
      this.props.onExpandedToggle();
    } else {
      this.setState({ hidden: !this.state.hidden });
    }
  }

  setRef = (c) => {
    this.node = c;
  }

  render () {
    const { status } = this.props;

    let media = null;

    if (status.get('content').length === 0 && status.get('media_attachments').size === 0) {
      return null;
    }

    const hidden = this.props.onExpandedToggle ? !this.props.expanded : this.state.hidden;

    const content = { __html: status.get('contentHtml') };
    const spoilerContent = { __html: status.get('spoilerHtml') };
    const directionStyle = { direction: 'ltr' };
    const classNames = classnames('status__content', {
      'status__content--with-action': this.props.onClick && this.context.router,
      'status__content--with-spoiler': status.get('spoiler_text').length > 0,
      'status__content--collapsed': this.state.collapsed === true,
    });

    if (isRtl(status.get('search_index'))) {
      directionStyle.direction = 'rtl';
    }

    const readMoreButton = (
      <button className='status__content__read-more-button' onClick={this.props.onClick} key='read-more'>
        <FormattedMessage id='status.read_more' defaultMessage='Read more' /><Icon id='angle-right' fixedWidth />
      </button>
    );

    const readArticleButton = (
      <button className='status__content__read-more-button' onClick={this.props.onClick} key='read-more'>
        <FormattedMessage id='status.read_article' defaultMessage='Read article' /><Icon id='angle-right' fixedWidth />
      </button>
    );

    if (status.get('spoiler_text').length > 0) {
      let mentionsPlaceholder = '';

      const mentionLinks = status.get('mentions').map(item => (
        <Permalink to={`/accounts/${item.get('id')}`} href={item.get('url')} key={item.get('id')} className='mention'>
          @<span className={item.get('acct') === item.get('username') ? 'fc_mention_local' : 'fc_mention_remote'}>
            {expandUsernames ? item.get('acct') : item.get('username')}
          </span>
        </Permalink>
      )).reduce((aggregate, item) => [...aggregate, item, ' '], []);

      const toggleText = hidden ? <FormattedMessage id='status.show_more' defaultMessage='Show more' /> : <FormattedMessage id='status.show_less' defaultMessage='Show less' />;

      if (hidden) {
        mentionsPlaceholder = <div>{mentionLinks}</div>;
      }

      const output = [
        <div className={classNames} ref={this.setRef} tabIndex='0' style={directionStyle} onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp}>
          <p style={{ marginBottom: hidden && status.get('mentions').isEmpty() ? '0px' : null }}>
            <span dangerouslySetInnerHTML={spoilerContent} />
            {' '}
            {status.get('activity_pub_type') === 'Article' ? '' : <span class="show_more_button"><button tabIndex='0' className={`status__content__spoiler-link ${hidden ? 'status__content__spoiler-link--show-more' : 'status__content__spoiler-link--show-less'}`} onClick={this.handleSpoilerClick}>{toggleText}</button></span>}
          </p>

          {mentionsPlaceholder}

          <div tabIndex={!hidden ? 0 : null} className={`status__content__text ${!hidden ? 'status__content__text--visible' : ''}`} style={directionStyle} dangerouslySetInnerHTML={content} />

          {!hidden && !!status.get('poll') && <PollContainer pollId={status.get('poll')} />}
        </div>,
      ];

      if (status.get('activity_pub_type') === 'Article' && !this.props.expanded) {
        output.push(readArticleButton);
      }

      return output;
    } else if (this.props.onClick) {
      const output = [
        <div className={classNames} ref={this.setRef} tabIndex='0' style={directionStyle} onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp} key='status-content'>
          <div className='status__content__text status__content__text--visible' style={directionStyle} dangerouslySetInnerHTML={content} />

          {!!status.get('poll') && <PollContainer pollId={status.get('poll')} />}
        </div>,
      ];

      if (this.state.collapsed) {
        output.push(readMoreButton);
      }

      return output;
    } else {
      return (
        <div className={classNames} ref={this.setRef} tabIndex='0' style={directionStyle}>
          <div className='status__content__text status__content__text--visible' style={directionStyle} dangerouslySetInnerHTML={content} />

          {!!status.get('poll') && <PollContainer pollId={status.get('poll')} />}
        </div>
      );
    }
  }

}
