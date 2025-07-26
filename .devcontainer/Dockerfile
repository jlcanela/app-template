FROM mcr.microsoft.com/devcontainers/dotnet:0-8.0

# Install Nix
RUN curl -L https://nixos.org/nix/install | sh

# Set Nix in PATH (attention : différentes shells peuvent demander d’autres ajustements)
ENV PATH="/root/.nix-profile/bin:${PATH}"
