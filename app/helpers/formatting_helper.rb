# frozen_string_literal: true

module FormattingHelper
  def html_aware_format(text, local, options = {})
    HtmlAwareFormatter.new(text, local, options).to_s
  end

  def linkify(text, options = {})
    TextFormatter.new(text, options).to_s
  end

  def format_article(text)
    text = text.gsub(/>\n+</, "><")
    text = "<span class='article-type'>#{text}</span>"
    text.html_safe # rubocop:disable Rails/OutputSafety
  end

  def extract_status_plain_text(status)
    PlainTextFormatter.new(status.text, status.local?).to_s
  end
  module_function :extract_status_plain_text

  def status_content_format(status)
    html_aware_format(status.text, status.local?, preloaded_accounts: [status.account] + (status.respond_to?(:active_mentions) ? status.active_mentions.map(&:account) : []))
  end

  def account_bio_format(account)
    html_aware_format(account.note, account.local?)
  end

  def account_field_value_format(field, with_rel_me: true)
    html_aware_format(field.value, field.account.local?, with_rel_me: with_rel_me, with_domains: true, multiline: false)
  end
end
