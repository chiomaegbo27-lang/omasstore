export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      delivery_locations: {
        Row: {
          created_at: string
          estimated_time: string
          fee: number
          id: string
          name: string
          zone: string
        }
        Insert: {
          created_at?: string
          estimated_time?: string
          fee?: number
          id?: string
          name: string
          zone: string
        }
        Update: {
          created_at?: string
          estimated_time?: string
          fee?: number
          id?: string
          name?: string
          zone?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          points: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_ingredients: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          meal_id: string
          name: string
          price: number
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          meal_id: string
          name: string
          price?: number
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          meal_id?: string
          name?: string
          price?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_ingredients_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_orders: {
        Row: {
          address: string | null
          cooking_fee: number
          created_at: string
          customer_name: string
          delivery_fee: number
          id: string
          ingredients_cost: number
          meal_id: string
          packaging_fee: number
          phone: string
          selected_ingredients: Json
          status: string
          total: number
          user_id: string | null
        }
        Insert: {
          address?: string | null
          cooking_fee?: number
          created_at?: string
          customer_name: string
          delivery_fee?: number
          id?: string
          ingredients_cost?: number
          meal_id: string
          packaging_fee?: number
          phone: string
          selected_ingredients?: Json
          status?: string
          total?: number
          user_id?: string | null
        }
        Update: {
          address?: string | null
          cooking_fee?: number
          created_at?: string
          customer_name?: string
          delivery_fee?: number
          id?: string
          ingredients_cost?: number
          meal_id?: string
          packaging_fee?: number
          phone?: string
          selected_ingredients?: Json
          status?: string
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_orders_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          base_price: number
          cooking_fee: number
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          packaging_fee: number
        }
        Insert: {
          base_price?: number
          cooking_fee?: number
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          packaging_fee?: number
        }
        Update: {
          base_price?: number
          cooking_fee?: number
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          packaging_fee?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string | null
          created_at: string
          customer_name: string
          delivery_fee: number
          fulfillment: string
          id: string
          items: Json
          phone: string
          points_earned: number
          points_used: number
          status: string
          subtotal: number
          total: number
          user_id: string | null
          zone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_name: string
          delivery_fee?: number
          fulfillment: string
          id?: string
          items: Json
          phone: string
          points_earned?: number
          points_used?: number
          status?: string
          subtotal: number
          total: number
          user_id?: string | null
          zone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_name?: string
          delivery_fee?: number
          fulfillment?: string
          id?: string
          items?: Json
          phone?: string
          points_earned?: number
          points_used?: number
          status?: string
          subtotal?: number
          total?: number
          user_id?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          aroma: string | null
          brand: string | null
          category: string
          cooking_notes: string | null
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          image_url: string | null
          in_stock: boolean
          name: string
          origin: string | null
          price: number
          pricing_unit: string | null
          quality_level: string | null
          stock: number
          subcategory: string | null
          taste: string | null
          texture: string | null
          unit: string | null
          video_url: string | null
        }
        Insert: {
          aroma?: string | null
          brand?: string | null
          category: string
          cooking_notes?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name: string
          origin?: string | null
          price: number
          pricing_unit?: string | null
          quality_level?: string | null
          stock?: number
          subcategory?: string | null
          taste?: string | null
          texture?: string | null
          unit?: string | null
          video_url?: string | null
        }
        Update: {
          aroma?: string | null
          brand?: string | null
          category?: string
          cooking_notes?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name?: string
          origin?: string | null
          price?: number
          pricing_unit?: string | null
          quality_level?: string | null
          stock?: number
          subcategory?: string | null
          taste?: string | null
          texture?: string | null
          unit?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          display_name: string | null
          id: string
          loyalty_points: number
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          loyalty_points?: number
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          loyalty_points?: number
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_awarded: boolean
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          bonus_awarded?: boolean
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          bonus_awarded?: boolean
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
