# Deploy Hububble to Azure using GitHub

This guide explains how you can configure GitHub to automatically deploy your hububble Docker container to Azure.

## Prerequisites
- Your project is hosted in a GitHub repository.
- Your Docker image is pushed to a container registry (e.g., Docker Hub).
- You have an Azure account and have created a free-tier Web App (Linux) that uses a custom container.
- You have the Azure credentials (a Service Principal) necessary for GitHub Actions.

## Step 1: Create a GitHub Actions Workflow
In your repository, create a workflow file at `.github/workflows/azure-deploy.yml`.

## Step 2: Configure GitHub Secrets
Add the following secrets in your GitHub repository settings:
- AZURE_CREDENTIALS: JSON output from your Azure Service Principal.
- AZURE_WEBAPP_NAME: The unique name of your Azure Web App.
- DOCKER_IMAGE: Your Docker image name (e.g., your-dockerhub-username/hububble:latest).

## Step 3: GitHub Actions Workflow Sample
The example below logs in to Azure via the Azure/login action and deploys your container.

For more details on configuring your Service Principal see [Microsoft's documentation](https://docs.microsoft.com/en-us/azure/developer/github/connect-from-azure?tabs=azure-cli).

## After Commit
When you push your changes to GitHub, this workflow will run and deploy your updated container image to your Azure web app.
