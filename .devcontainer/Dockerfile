# Start from GitHub’s official Universal Devcontainer (includes sudo, codespace user, etc)
FROM mcr.microsoft.com/vscode/devcontainers/universal:2-linux

# Install Nix in single-user mode, as root
RUN curl -L https://nixos.org/nix/install | sh -s -- --no-daemon

# Put nix in path for all shells
RUN echo ". /root/.nix-profile/etc/profile.d/nix.sh" >> /etc/profile \
    && echo ". /root/.nix-profile/etc/profile.d/nix.sh" >> /etc/bash.bashrc \
        && echo ". /root/.nix-profile/etc/profile.d/nix.sh" >> /root/.bashrc \
            && echo ". /root/.nix-profile/etc/profile.d/nix.sh" >> /home/codespace/.bashrc

            # (Optional) Set up Direnv or extra VS Code extensions for Nix dev
            # RUN . /root/.nix-profile/etc/profile.d/nix.sh && nix-env -i direnv
            