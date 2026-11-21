# Build context: backend/
#   docker build -t tutormatching-api backend
# The image also ships the DatabaseMigrator under /app/migrator so the host
# (Render pre-deploy command) can migrate the database before each release.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish src/TutorMatching.Api/TutorMatching.Api.csproj -c Release -o /out/api \
 && dotnet publish tools/TutorMatching.DatabaseMigrator/TutorMatching.DatabaseMigrator.csproj -c Release -o /out/migrator

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS api
WORKDIR /app
COPY --from=build /out/api .
COPY --from=build /out/migrator ./migrator
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_HTTP_PORTS=8080
# Runs as root so the API can write to the Render persistent disk mounted at
# /app/wwwroot/uploads (Render mounts disks as root).
EXPOSE 8080
ENTRYPOINT ["dotnet", "TutorMatching.Api.dll"]
