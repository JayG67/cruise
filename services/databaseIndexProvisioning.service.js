const { sql } = require('drizzle-orm')

async function provisionDatabaseIndexes(db) {
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_customer_uuid ON customers("customerUuid");
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_booking_uuid ON bookings("bookingUuid");
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_passengers_uuid ON booking_passengers("bookingPassengerUuid");
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_itinerary_favorites_uuid ON customer_itinerary_favorites("favoriteUuid");
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_pre_cruise_checklists_uuid ON customer_pre_cruise_checklists("checklistUuid");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_customers_updated_timestamp ON customers("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_bookings_updated_timestamp ON bookings("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_bookings_created_by_user ON bookings("createdByUserId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_cruise_lines_updated_timestamp ON cruise_lines("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_ships_updated_timestamp ON ships("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_sailings_updated_timestamp ON sailings("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_events_created_timestamp ON audit_events("createdAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_sailings_departure_date_value ON sailings("departureDateValue");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_operations_date_value_status ON turnaround_operations("turnaroundDateValue", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_tasks_due_time_value ON turnaround_tasks("operationId", "dueTimeValue");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_task_updates_created_timestamp ON turnaround_task_updates("taskId", "createdAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_escalations_created_timestamp ON turnaround_escalations("operationId", "createdAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_handoffs_due_time_value ON turnaround_handoffs("operationId", "dueTimeValue");
  `)


  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_app_users_primary_customer ON app_users("primaryCustomerId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_app_users_type_status ON app_users("userType", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_app_users_cruise_line_ship ON app_users("cruiseLineId", "assignedShipId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_app_user_roles_user_status ON app_user_roles("userId", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_app_user_roles_role_scope ON app_user_roles("roleId", "assignmentScope");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_app_user_roles_tenant_assignment ON app_user_roles("cruiseLineId", "assignedShipId", "assignmentScope");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_demo_users_normalized_user_role ON demo_users("normalizedUserId", "normalizedRoleId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_demo_users_operational_assignment ON demo_users("cruiseLineId", "assignedShipId", role);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_demo_users_turnaround_sailing_assignment ON demo_users("cruiseLineId", "assignedShipId", "assignedSailingId", role);
  `)


  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_tasks_owner_user ON turnaround_tasks("ownerUserId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_task_updates_author_user ON turnaround_task_updates("authorUserId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_signoffs_approver_user ON turnaround_signoffs("approverUserId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_escalations_owner_user ON turnaround_escalations("ownerUserId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_handoffs_owner_user ON turnaround_handoffs("ownerUserId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_ships_cruise_line_id ON ships("cruiseLineId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_sailings_ship_id_departure_date ON sailings("shipId", "departureDate");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_sailings_departure_route ON sailings("departureDate", "departurePort", "arrivalPort");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_itinerary_days_sailing_day ON itinerary_days("sailingId", day);
  `)

  await db.execute(sql`
    ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS "createdAt" varchar(40);
    ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz;
    ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40);
    ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz;
    UPDATE itinerary_days
    SET
      "createdAt" = COALESCE("createdAt", NOW()::text),
      "createdAtTimestamp" = COALESCE("createdAtTimestamp", NOW()),
      "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()::text),
      "updatedAtTimestamp" = COALESCE("updatedAtTimestamp", "createdAtTimestamp", NOW());
  `)

  await db.execute(sql`
    ALTER TABLE activity_schedules ADD COLUMN IF NOT EXISTS "createdAt" varchar(40);
    ALTER TABLE activity_schedules ADD COLUMN IF NOT EXISTS "createdAtTimestamp" timestamptz;
    ALTER TABLE activity_schedules ADD COLUMN IF NOT EXISTS "updatedAt" varchar(40);
    ALTER TABLE activity_schedules ADD COLUMN IF NOT EXISTS "updatedAtTimestamp" timestamptz;
    UPDATE activity_schedules
    SET
      "createdAt" = COALESCE("createdAt", NOW()::text),
      "createdAtTimestamp" = COALESCE("createdAtTimestamp", NOW()),
      "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()::text),
      "updatedAtTimestamp" = COALESCE("updatedAtTimestamp", "createdAtTimestamp", NOW());
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_itinerary_days_updated ON itinerary_days("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_activity_schedules_updated ON activity_schedules("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_activity_schedules_itinerary_day ON activity_schedules("itineraryDayId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_bookings_sailing_status ON bookings("sailingId", "bookingStatus");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_bookings_created_by_customer ON bookings("createdByCustomerId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_booking_passengers_booking_id ON booking_passengers("bookingId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_booking_passengers_customer_id ON booking_passengers("customerId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_customer_itinerary_favorites_customer_id ON customer_itinerary_favorites("customerId");
  `)


  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_customer_itinerary_favorites_customer_created ON customer_itinerary_favorites("customerId", "createdAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_customer_pre_cruise_checklists_updated ON customer_pre_cruise_checklists("updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_booking_passengers_customer_updated ON booking_passengers("customerId", "updatedAtTimestamp");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_operations_sailing_status ON turnaround_operations("sailingId", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_operations_date_status ON turnaround_operations("turnaroundDate", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_tasks_operation_role_status ON turnaround_tasks("operationId", "departmentRole", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_tasks_operation_sort ON turnaround_tasks("operationId", "sortOrder");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_task_updates_task_created_at ON turnaround_task_updates("taskId", "createdAt");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_task_dependencies_operation_status ON turnaround_task_dependencies("operationId", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_task_dependencies_task_ids ON turnaround_task_dependencies("taskId", "dependsOnTaskId");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_handoffs_operation_status ON turnaround_handoffs("operationId", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_handoffs_departments ON turnaround_handoffs("fromDepartmentRole", "toDepartmentRole");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_escalations_operation_status_severity ON turnaround_escalations("operationId", status, severity);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_escalations_department_status ON turnaround_escalations("departmentRole", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_staffing_operation_role ON turnaround_staffing("operationId", "departmentRole");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_turnaround_signoffs_operation_role_status ON turnaround_signoffs("operationId", "departmentRole", status);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events("createdAt");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events("entityType", "entityId", "createdAt");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events("actorUserId", "createdAt");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_scope ON audit_events("cruiseLineId", "shipId", "sailingId", "createdAt");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_events_operation ON audit_events("operationId", "createdAt");
  `)

}

module.exports = provisionDatabaseIndexes
