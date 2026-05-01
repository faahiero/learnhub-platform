FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/Gateway/ApiGateway/ApiGateway.csproj", "Gateway/ApiGateway/"]
RUN dotnet restore "Gateway/ApiGateway/ApiGateway.csproj"
COPY src/Gateway/ Gateway/
WORKDIR "/src/Gateway/ApiGateway"
RUN dotnet build "ApiGateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ApiGateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY src/Gateway/ApiGateway/ocelot.json .
ENV ASPNETCORE_URLS=http://+:80
ENTRYPOINT ["dotnet", "ApiGateway.dll"]
