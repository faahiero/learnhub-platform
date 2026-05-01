FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/BuildingBlocks/Common/Common.csproj", "BuildingBlocks/Common/"]
COPY ["src/Services/Course/Course.API/Course.API.csproj", "Services/Course/Course.API/"]
RUN dotnet restore "Services/Course/Course.API/Course.API.csproj"
COPY src/BuildingBlocks/ BuildingBlocks/
COPY src/Services/Course/ Services/Course/
WORKDIR "/src/Services/Course/Course.API"
RUN dotnet build "Course.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Course.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:80
ENTRYPOINT ["dotnet", "Course.API.dll"]
