# CLI-LLM: Closed-Loop Intelligence with LLMs 

CLI-LLM is an open-source project that brings Large Language Model (LLM) capabilities directly into Grafana dashboards. It consists of a Grafana panel plugin and a backend service, enabling interactive AI-powered analytics, chat, and closed-loop decision making with support for multiple LLM providers.


## Overview

This repository contains:

- **/src**: The source code for the Grafana panel plugin..  
  See [`/src/README.md`](./src/README.md) for plugin features, configuration, and usage.
- **/backend**: The backend service for connecting to LLM providers (OpenAI, Google, Ollama, etc.), handling requests, and forwarding responses.  
  See [`/backend/README.md`](./backend/README.md) for backend setup and API details.
- **/provisioning**: Example Grafana dashboard provisoning. Contains example dockerfile. 
  See [`/provisioning/README.md`](./provisioning/README.md) for more information.

## Key Features

- **Multi-Provider Support**: Compatible with various LLM providers including Google, OpenAPI, Glama and others, plus support for local LLM deployment
- **Interactive Interface**: Chat-like interface for natural language interactions with LLM models
- **Data Source Integration**: Automatically reads data from different Grafana data sources over various time periods with automatic updates
- **Closed-Loop Decision Making**: Forward LLM responses to external endpoints for automated actions and decision implementation

## Getting started

1. **Set up the backend**  
   See [`/backend/README.md`](./backend/README.md) for instructions.
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Build plugin**
   ```bash
   npm run build
   ```
4. **Install the plugin**
   Copy the contents of dist folder to plugins folder (/var/lib/grafana/plugins/cli-llm/)
5. **Enable unauthorized plugins**
   Modify the /etc/grafana/grafana.ini file and add the following line:
   ```ini
      allow_loading_unsigned_plugins = navidan-llm-panel
   ```

## TODO

- [ ] Fetch models from the API provider for other providers
- [ ] Improve backend security
- [ ] Improve the screenshot feature make use of multi-modal data
- [ ] Feature to upload PDF as part of system prompt
