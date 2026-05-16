ARG REDBOX_BASE_IMAGE=qcifengineering/redbox-portal:develop

FROM ${REDBOX_BASE_IMAGE} AS builder

USER root

COPY . /opt/redbox-hook--researchdatabox-sails-hook-redbox-supportagreements

RUN --mount=type=cache,target=/root/.npm \
  cd /opt/redbox-hook--researchdatabox-sails-hook-redbox-supportagreements \
  && npm install --include=dev --ignore-scripts --legacy-peer-deps \
  && npm run compile \
  && cd /opt/redbox-portal \
  && npm install --legacy-peer-deps --ignore-scripts /opt/redbox-hook--researchdatabox-sails-hook-redbox-supportagreements \
  && mkdir -p /opt/redbox-portal/views /opt/redbox-portal/assets /opt/redbox-portal/language-defaults \
  && if [ -d /opt/redbox-hook--researchdatabox-sails-hook-redbox-supportagreements/views ]; then cp -a /opt/redbox-hook--researchdatabox-sails-hook-redbox-supportagreements/views/. /opt/redbox-portal/views/; fi \
  && if [ -d /opt/redbox-hook--researchdatabox-sails-hook-redbox-supportagreements/assets ]; then cp -a /opt/redbox-hook--researchdatabox-sails-hook-redbox-supportagreements/assets/. /opt/redbox-portal/assets/; fi \
  && if [ -d /opt/redbox-hook--researchdatabox-sails-hook-redbox-supportagreements/language-defaults ]; then cp -a /opt/redbox-hook--researchdatabox-sails-hook-redbox-supportagreements/language-defaults/. /opt/redbox-portal/language-defaults/; fi

FROM builder AS redbox-hook--researchdatabox-sails-hook-redbox-supportagreements

RUN chown -R node:node /opt/redbox-portal

USER node
