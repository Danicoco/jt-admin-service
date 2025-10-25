const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../utils/mongoDb");
const { Schema } = mongoose;

const PermissionSchema = new Schema(
    {
        module: {
            type: String,
            permission: {
                canCreate: Boolean,
                canView: Boolean,
                canUpdate: Boolean,
                canDelete: Boolean,
            }
        }
    }
)

const RoleSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    title: {
      type: String,
      required: true,
      index: true
    },
    permissions: [PermissionSchema],
    numberOfUserAssigned: {
      type: Number,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    collection: "roles",
  }
);

module.exports = db.model("Role", RoleSchema);
