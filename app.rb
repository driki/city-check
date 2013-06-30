require 'json'
require 'httpclient'
require 'nokogiri'
require 'selenium-webdriver'
require 'sinatra'
require 'yomu'
require 'open-uri'

agent_name = "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.2 Safari/537.36"
@@http_client = HTTPClient.new(nil, :agent_name)
@@http_client.connect_timeout = 60

get '/check?*' do
  url = URI::encode(params[:url])

  checks = Hash.new
  checks[:url] = params[:url]

  # TODO: validate the page with W3C validator

  # TODO: Take a screenshot of the website
  # width = 1024
  # height = 728
  # driver = Selenium::WebDriver.for :firefox
  # driver.navigate.to 'http://domain.com'
  # driver.execute_script %Q{
  #   window.resizeTo(#{width}, #{height});
  # }
  # driver.save_screenshot('/tmp/screenshot.png')
  # driver.quit

  # Get the homepage
  response_start_time = Time.now
  response = @@http_client.get(url, :follow_redirect => true)
  response_end_time = Time.now
  checks[:response_time] = ((response_end_time - response_start_time)/3600)*1000

  # TODO: Check to see if the web server is using HTTP Compression
  # -H 'Accept-Encoding: gzip,deflate'

  doc = Nokogiri::HTML(response.body)

  # Remove extraneous styles
  doc.xpath('//@style').remove

  # Remove javascripts
  doc.css('style,script').remove
  doc.xpath("//@*[starts-with(name(),'on')]").remove

  javavscript_required_regex = /you have JavaScript disabled/i
  response.body =~ javavscript_required_regex
  if $&
    checks[:javascript_required] = true
  else
    checks[:javascript_required] = false
  end

  checks[:page_text] = doc.text
  checks[:number_of_words] = checks[:page_text].split.size

  checks[:server] = response.http_header["Server"]
  checks[:powered_by] = response.http_header["X-Powered-By"]
  checks[:content_length] = response.http_header["Content-Length"]
  checks[:content_type] = response.http_header["Content-Type"]
  checks[:etag] = response.http_header["ETag"]
  checks[:status] = response.http_header["Status"]

  # Check to see which vendor or tool is being used
  vendor_regex = /(www.gov-i.com|CivicPlus|GovOffice|Virtual Towns & Schools Website|www.qscend.com|www.cit-e.net)/
  response.body+get_all_hrefs(response.body).join =~ vendor_regex
  checks[:website_vendor] = $&

  # Is there a phone number present on the homepage?
  phone_regex = /\(?(\d{3})\)?(\s+|-|\.)?\d{3}(\s+|-|\.)\d{4}/
  checks[:page_text] =~ phone_regex
  checks[:phone_number_present] = $&

  # Check to see if there is an email address
  email_regex = Regexp.new(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}\b/)
  response.body =~ email_regex
  checks[:email_addresses] = $&

  # TODO Look for additional Analytics services
  analytics_regex = /google-analytics.com/
  response.body =~ analytics_regex
  checks[:analytics_present] = $&

  # TODO: look for specific page content types
  #* site:http://www.ci.watertown.ma.us/ About 9,010 results (0.18 seconds)
  #* site:http://www.ci.watertown.ma.us/ filetype:pdf About 919 results (0.51 seconds)

  # TODO: Look for the most recent fiscal year BUDGET document
  # points for CSV, EXCEL, minus points for PDF or PowerPoint
  # Accessible from the homepage
  # Narrative for the budget
  # Online checkbook register
  # Definition of technical terms

  # TODO: Look for poorly named CSS

  # TODO Look for voting records
  # TODO contact information and names for elected officials

  # TODO How many unique visitors do you have per month? via Compete
  # TODO Your Alexa rating

  # TODO Are meeting minutes available online?
  # Points for HTML, audio, video, minus for PDF only

  # TODO Can we find elected official contact information easily?

  # TODO Can we find building permit information
  # * Forms available online
  # * Rules for submitting the Forms
  # * Costs
  # * Building codes
  # * Online tracking of your building permit

  # Look for a copyright
  copyright_regex = /Copyright.*&copy;.\d{4}/
  response.body =~ copyright_regex
  checks[:copyright_present] = $&

  # Look for public hours
  hours_regex = /(public hours|hours)/i
  response.body =~ hours_regex
  checks[:hours_present] = $&

  # Look for Blog
  blog_regex = /blog/
  response.body =~ blog_regex
  checks[:blog_present] = $&

  # Look for RSS
  rss_regex = /rss/
  response.body =~ rss_regex
  checks[:rss_present] = $&

  # Look for Twitter
  twitter_regex = /twitter.com/
  response.body =~ twitter_regex
  checks[:twitter_present] = $&

  # Look for Facebook
  facebook_regex = /facebook.com/
  response.body =~ facebook_regex
  checks[:facebook_present] = $&

  # TODO Look for SeeClickFix

  # Look for Search feature
  search_regex = /search/i
  response.body =~ search_regex
  checks[:search_present] = $&

  # TODO Look for high Javascript driven navigation use
  # Javascript menus require the user to hover over them to find out
  # what is contained. Often this can be challenging for some people.

  # TODO look for a mobile version

  # Count the number of images and how big they are
  links_size = doc.css('img').size
  checks[:number_of_images] = links_size
  checks[:image_size] = 0
  checks[:images] = doc.css('img').map {|link| link.attribute('src').to_s}.uniq.sort.delete_if {|href| href.empty?}
  doc.css('img').each do |img_link|
    img_url = img_link.attribute('src').to_s
    begin
      img_size = @@http_client.head(img_url).http_header['Content-Length'].first.to_i
    rescue Exception => e
      img_size = @@http_client.head(url+img_url).http_header['Content-Length'].first.to_i
    end
    checks[:image_size] += img_size
  end

  # TODO check files size of all images

  # Looks at all the links on the page
  links = get_all_hrefs(response.body)
  checks[:number_of_links] = links.size
  checks[:links] = get_all_hrefs(response.body)
  if checks[:number_of_links] > 50
    checks[:high_number_of_links] = true
  end

  # Check for underlying tech in the url
  # TODO check only relative path urls
  tech_regex = /(\.asp|\.aspx|\.do|\.jsp|\.php)/
  if links.join.scan(tech_regex).length > 0
    checks[:displaying_tech_in_url] = true
  else
    checks[:displaying_tech_in_url] = false
  end

  # Check to see how many PDFs are directly linked from the site
  pdf_extentsion_regex = /(\.pdf|\.PDF)/
  if links.join.scan(pdf_extentsion_regex).length > 0
    checks[:linking_pdfs_directly] = true
  else
    checks[:linking_pdfs_directly] = false
  end


  # TODO Check to see if the links are human readable


  # Check that there is a robots.txt file
  response = @@http_client.get("#{url}/robots.txt", :follow_redirect => true)
  checks[:robots_response_code] = response.code

  Timeout::timeout(60) {
    text = safe_squeeze(Yomu.read(:text, response.body))
    checks[:robots_text] = text
  }
  checks

  checks.to_json
end

# Method that will get all links on the page
def get_all_hrefs(html)
  doc = Nokogiri::HTML(html)
  links = doc.css('a')

  hrefs = links.map {|link| link.attribute('href').to_s}.uniq.sort.delete_if {|href| href.empty?}
  return hrefs
end

# Remove superfluous whitespaces from the given string
def safe_squeeze(value)
  value = value.strip.gsub(/\s+/, ' ').squeeze(' ').strip unless value.nil?
end