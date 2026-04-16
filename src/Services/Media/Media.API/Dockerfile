FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/BuildingBlocks/Common/Common.csproj", "BuildingBlocks/Common/"]
COPY ["src/Services/Media/Media.API/Media.API.csproj", "Services/Media/Media.API/"]
RUN dotnet restore "Services/Media/Media.API/Media.API.csproj"
COPY src/BuildingBlocks/ BuildingBlocks/
COPY src/Services/Media/ Services/Media/
WORKDIR "/src/Services/Media/Media.API"
RUN dotnet build "Media.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Media.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:80
ENTRYPOINT ["dotnet", "Media.API.dll"]
