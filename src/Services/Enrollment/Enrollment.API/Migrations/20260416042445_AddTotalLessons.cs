using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Enrollment.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTotalLessons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TotalLessons",
                table: "Enrollments",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalLessons",
                table: "Enrollments");
        }
    }
}
