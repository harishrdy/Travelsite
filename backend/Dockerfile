FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build

WORKDIR /src

COPY PickNBook.Api.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish PickNBook.Api.csproj \
    --configuration Release \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS runtime

WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_RUNNING_IN_CONTAINER=true

COPY --from=build /app/publish ./

# Container configuration is supplied by environment variables in docker-compose.
# Removing appsettings files keeps local secrets out of the production image.
RUN addgroup -S appgroup \
    && adduser -S -G appgroup -u 10001 appuser \
    && rm -f appsettings.json appsettings.Development.json \
    && mkdir -p wwwroot/profile-images \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["dotnet", "PickNBook.Api.dll"]
