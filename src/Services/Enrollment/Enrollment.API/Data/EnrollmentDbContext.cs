using Enrollment.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Enrollment.API.Data;

public class EnrollmentDbContext : DbContext
{
    public EnrollmentDbContext(DbContextOptions<EnrollmentDbContext> options) : base(options) { }

    public DbSet<EnrollmentEntity> Enrollments => Set<EnrollmentEntity>();
    public DbSet<LessonProgress> LessonProgresses => Set<LessonProgress>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EnrollmentEntity>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.CourseId }).IsUnique();

            entity.HasMany(e => e.LessonProgresses)
                .WithOne(lp => lp.Enrollment)
                .HasForeignKey(lp => lp.EnrollmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.CourseId }).IsUnique();
        });
    }
}
