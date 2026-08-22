ARG REGISTRY=quay.io/kubealex
FROM ${REGISTRY}/image-mode-baseos:latest

ARG API_HOST=localhost

RUN dnf install -y nodejs npm && dnf clean all

COPY package.json package-lock.json* /usr/share/train-tickets/departures/
RUN cd /usr/share/train-tickets/departures && npm install

COPY index.html vite.config.js /usr/share/train-tickets/departures/
COPY src/ /usr/share/train-tickets/departures/src/

COPY usr/ /usr/

RUN mkdir -p /etc/train-tickets && echo "API_HOST=${API_HOST}" > /etc/train-tickets/departures.env

RUN systemctl enable train-tickets-departures.service

RUN firewall-offline-cmd --zone=public --add-port=5174/tcp
