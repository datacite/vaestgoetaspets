FROM phusion/passenger-nodejs:2.1.0
LABEL maintainer="jrhoads@datacite.org"

# Set correct environment variables
ENV HOME /home/app
ENV PASSENGER_DISABLE_LOG_PREFIX true

# Use baseimage-docker's init process
CMD ["/sbin/my_init"]

# Set debconf to run non-interactively
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

# Update installed APT packages, clean up when done
RUN apt-get update && \
    apt-get upgrade -y -o Dpkg::Options::="--force-confold" && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install yarn
RUN npm install --global yarn

# Enable Passenger and Nginx and remove the default site
# Preserve env variables for nginx
RUN rm -f /etc/service/nginx/down && \
    rm /etc/nginx/sites-enabled/default
COPY vendor/docker/webapp.conf /etc/nginx/sites-enabled/webapp.conf
COPY vendor/docker/00_app_env.conf /etc/nginx/conf.d/00_app_env.conf
COPY vendor/docker/apollo.conf /etc/nginx/main.d/apollo.conf

# Use Amazon NTP servers
COPY vendor/docker/ntp.conf /etc/ntp.conf

# Copy webapp folder
COPY . /home/app/webapp/

RUN chown -R app:app /home/app/webapp && \
    chmod -R 755 /home/app/webapp

# Install npm packages and build dist
WORKDIR /home/app/webapp
RUN yarn install --frozen-lockfile --silent

# Run additional scripts during container startup (i.e. not at build time)
RUN mkdir -p /etc/my_init.d

# install custom ssh key during startup
COPY vendor/docker/10_ssh.sh /etc/my_init.d/10_ssh.sh

# Expose web
EXPOSE 80
