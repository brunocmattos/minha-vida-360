export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      diary_entries: {
        Row: {
          area_slug: string | null;
          content: string;
          created_at: string;
          entry_date: string;
          id: string;
          owner_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          area_slug?: string | null;
          content: string;
          created_at?: string;
          entry_date?: string;
          id?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Update: {
          area_slug?: string | null;
          content?: string;
          created_at?: string;
          entry_date?: string;
          id?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      fin_categories: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          name: string;
          owner_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          name: string;
          owner_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          name?: string;
          owner_id?: string;
        };
        Relationships: [];
      };
      fin_credit_records: {
        Row: {
          amount: number;
          created_at: string;
          creditor: string;
          id: string;
          notes: string | null;
          owner_id: string;
          slug: string;
          source: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          creditor: string;
          id?: string;
          notes?: string | null;
          owner_id?: string;
          slug: string;
          source?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          creditor?: string;
          id?: string;
          notes?: string | null;
          owner_id?: string;
          slug?: string;
          source?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      fin_entries: {
        Row: {
          amount_manual: boolean;
          amount_paid: number;
          amount_planned: number;
          benefit_account: string | null;
          category_id: string | null;
          competence: string | null;
          created_at: string;
          day_known: boolean;
          description: string;
          due_date: string;
          group_label: string | null;
          id: string;
          installment_no: number | null;
          installment_total: number | null;
          kind: string;
          nature: Database["public"]["Enums"]["fin_nature"];
          notes: string | null;
          owner_id: string;
          paid_date: string | null;
          recurrence_id: string | null;
          sort_order: number;
          updated_at: string;
          wallet: string;
        };
        ComputedFields: never;
        Insert: {
          amount_manual?: boolean;
          amount_paid?: number;
          amount_planned: number;
          benefit_account?: string | null;
          category_id?: string | null;
          competence?: string | null;
          created_at?: string;
          day_known?: boolean;
          description: string;
          due_date: string;
          group_label?: string | null;
          id?: string;
          installment_no?: number | null;
          installment_total?: number | null;
          kind: string;
          nature?: Database["public"]["Enums"]["fin_nature"];
          notes?: string | null;
          owner_id?: string;
          paid_date?: string | null;
          recurrence_id?: string | null;
          sort_order?: number;
          updated_at?: string;
          wallet?: string;
        };
        Update: {
          amount_manual?: boolean;
          amount_paid?: number;
          amount_planned?: number;
          benefit_account?: string | null;
          category_id?: string | null;
          competence?: string | null;
          created_at?: string;
          day_known?: boolean;
          description?: string;
          due_date?: string;
          group_label?: string | null;
          id?: string;
          installment_no?: number | null;
          installment_total?: number | null;
          kind?: string;
          nature?: Database["public"]["Enums"]["fin_nature"];
          notes?: string | null;
          owner_id?: string;
          paid_date?: string | null;
          recurrence_id?: string | null;
          sort_order?: number;
          updated_at?: string;
          wallet?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fin_entries_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "fin_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fin_entries_recurrence_id_fkey";
            columns: ["recurrence_id"];
            isOneToOne: false;
            referencedRelation: "fin_recurrences";
            referencedColumns: ["id"];
          },
        ];
      };
      fin_opening_history: {
        Row: {
          changed_at: string;
          competence: string;
          id: string;
          new_amount: number | null;
          new_included: boolean | null;
          old_amount: number | null;
          old_included: boolean | null;
          opening_id: string;
          owner_id: string;
          wallet: string;
        };
        ComputedFields: never;
        Insert: {
          changed_at?: string;
          competence: string;
          id?: string;
          new_amount?: number | null;
          new_included?: boolean | null;
          old_amount?: number | null;
          old_included?: boolean | null;
          opening_id: string;
          owner_id?: string;
          wallet: string;
        };
        Update: {
          changed_at?: string;
          competence?: string;
          id?: string;
          new_amount?: number | null;
          new_included?: boolean | null;
          old_amount?: number | null;
          old_included?: boolean | null;
          opening_id?: string;
          owner_id?: string;
          wallet?: string;
        };
        Relationships: [];
      };
      fin_openings: {
        Row: {
          amount: number;
          competence: string;
          created_at: string;
          id: string;
          included: boolean;
          label: string | null;
          owner_id: string;
          updated_at: string;
          wallet: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          competence: string;
          created_at?: string;
          id?: string;
          included?: boolean;
          label?: string | null;
          owner_id?: string;
          updated_at?: string;
          wallet: string;
        };
        Update: {
          amount?: number;
          competence?: string;
          created_at?: string;
          id?: string;
          included?: boolean;
          label?: string | null;
          owner_id?: string;
          updated_at?: string;
          wallet?: string;
        };
        Relationships: [];
      };
      fin_payslips: {
        Row: {
          competence: string;
          created_at: string;
          deductions: NonNullable<Json>;
          earnings: NonNullable<Json>;
          employer: string;
          id: string;
          notes: string | null;
          owner_id: string;
          paid_month: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          competence: string;
          created_at?: string;
          deductions?: NonNullable<Json>;
          earnings?: NonNullable<Json>;
          employer: string;
          id?: string;
          notes?: string | null;
          owner_id?: string;
          paid_month?: string | null;
          updated_at?: string;
        };
        Update: {
          competence?: string;
          created_at?: string;
          deductions?: NonNullable<Json>;
          earnings?: NonNullable<Json>;
          employer?: string;
          id?: string;
          notes?: string | null;
          owner_id?: string;
          paid_month?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      fin_recurrences: {
        Row: {
          active: boolean;
          amount_planned: number;
          benefit_account: string | null;
          category_id: string | null;
          created_at: string;
          day_known: boolean;
          day_of_month: number;
          description: string;
          end_month: string | null;
          formula: string | null;
          frequency: string;
          group_label: string | null;
          id: string;
          installment_first: number | null;
          installment_total: number | null;
          kind: string;
          nature: Database["public"]["Enums"]["fin_nature"];
          owner_id: string;
          slug: string | null;
          sort_order: number;
          start_month: string;
          wallet: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          amount_planned: number;
          benefit_account?: string | null;
          category_id?: string | null;
          created_at?: string;
          day_known?: boolean;
          day_of_month: number;
          description: string;
          end_month?: string | null;
          formula?: string | null;
          frequency?: string;
          group_label?: string | null;
          id?: string;
          installment_first?: number | null;
          installment_total?: number | null;
          kind: string;
          nature?: Database["public"]["Enums"]["fin_nature"];
          owner_id?: string;
          slug?: string | null;
          sort_order?: number;
          start_month: string;
          wallet?: string;
        };
        Update: {
          active?: boolean;
          amount_planned?: number;
          benefit_account?: string | null;
          category_id?: string | null;
          created_at?: string;
          day_known?: boolean;
          day_of_month?: number;
          description?: string;
          end_month?: string | null;
          formula?: string | null;
          frequency?: string;
          group_label?: string | null;
          id?: string;
          installment_first?: number | null;
          installment_total?: number | null;
          kind?: string;
          nature?: Database["public"]["Enums"]["fin_nature"];
          owner_id?: string;
          slug?: string | null;
          sort_order?: number;
          start_month?: string;
          wallet?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fin_recurrences_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "fin_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      fin_savings_goals: {
        Row: {
          allocated_amount: number | null;
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          target_amount: number | null;
          target_date: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          allocated_amount?: number | null;
          created_at?: string;
          id?: string;
          name: string;
          owner_id?: string;
          target_amount?: number | null;
          target_date?: string | null;
          updated_at?: string;
        };
        Update: {
          allocated_amount?: number | null;
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          target_amount?: number | null;
          target_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      fin_transfers: {
        Row: {
          amount: number;
          created_at: string;
          from_wallet: string;
          id: string;
          owner_id: string;
          reversed_at: string | null;
          to_wallet: string;
          transfer_date: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          from_wallet: string;
          id?: string;
          owner_id?: string;
          reversed_at?: string | null;
          to_wallet: string;
          transfer_date: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          from_wallet?: string;
          id?: string;
          owner_id?: string;
          reversed_at?: string | null;
          to_wallet?: string;
          transfer_date?: string;
        };
        Relationships: [];
      };
      home_maintenance: {
        Row: {
          cost: number | null;
          created_at: string;
          done_date: string | null;
          id: string;
          kind: string;
          notes: string | null;
          owner_id: string;
          provider: string | null;
          scheduled_date: string | null;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          cost?: number | null;
          created_at?: string;
          done_date?: string | null;
          id?: string;
          kind?: string;
          notes?: string | null;
          owner_id?: string;
          provider?: string | null;
          scheduled_date?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          cost?: number | null;
          created_at?: string;
          done_date?: string | null;
          id?: string;
          kind?: string;
          notes?: string | null;
          owner_id?: string;
          provider?: string | null;
          scheduled_date?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      luisa_conversations: {
        Row: {
          created_at: string;
          id: string;
          owner_id: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          owner_id?: string;
          title?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          owner_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      luisa_messages: {
        Row: {
          action: Json | null;
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          owner_id: string;
          role: string;
        };
        ComputedFields: never;
        Insert: {
          action?: Json | null;
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          owner_id?: string;
          role: string;
        };
        Update: {
          action?: Json | null;
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          owner_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "luisa_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "luisa_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      pet_care_records: {
        Row: {
          created_at: string;
          done_date: string | null;
          id: string;
          kind: string;
          next_date: string | null;
          notes: string | null;
          overdue_since: string | null;
          owner_id: string;
          pet_id: string;
          shared_group: string | null;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          done_date?: string | null;
          id?: string;
          kind: string;
          next_date?: string | null;
          notes?: string | null;
          overdue_since?: string | null;
          owner_id?: string;
          pet_id: string;
          shared_group?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          done_date?: string | null;
          id?: string;
          kind?: string;
          next_date?: string | null;
          notes?: string | null;
          overdue_since?: string | null;
          owner_id?: string;
          pet_id?: string;
          shared_group?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pet_care_records_pet_id_fkey";
            columns: ["pet_id"];
            isOneToOne: false;
            referencedRelation: "pet_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pet_contacts: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          owner_id: string;
          phone: string | null;
          role: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          owner_id?: string;
          phone?: string | null;
          role?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          owner_id?: string;
          phone?: string | null;
          role?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      pet_profiles: {
        Row: {
          birth_date: string | null;
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          owner_id: string;
          photo_url: string | null;
          slug: string;
          updated_at: string;
          weight_kg: number | null;
        };
        ComputedFields: never;
        Insert: {
          birth_date?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          owner_id?: string;
          photo_url?: string | null;
          slug: string;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Update: {
          birth_date?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          owner_id?: string;
          photo_url?: string | null;
          slug?: string;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      shopping_items: {
        Row: {
          bought_at: string | null;
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          quantity: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          bought_at?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          owner_id?: string;
          quantity?: string | null;
          updated_at?: string;
        };
        Update: {
          bought_at?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          quantity?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      task_completions: {
        Row: {
          completed_at: string;
          due_date: string | null;
          id: string;
          owner_id: string;
          task_id: string;
        };
        ComputedFields: never;
        Insert: {
          completed_at?: string;
          due_date?: string | null;
          id?: string;
          owner_id?: string;
          task_id: string;
        };
        Update: {
          completed_at?: string;
          due_date?: string | null;
          id?: string;
          owner_id?: string;
          task_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          area_slug: string | null;
          completed_at: string | null;
          created_at: string;
          done: boolean;
          due_date: string | null;
          id: string;
          owner_id: string;
          priority: string;
          recurrence: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          area_slug?: string | null;
          completed_at?: string | null;
          created_at?: string;
          done?: boolean;
          due_date?: string | null;
          id?: string;
          owner_id?: string;
          priority?: string;
          recurrence?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          area_slug?: string | null;
          completed_at?: string | null;
          created_at?: string;
          done?: boolean;
          due_date?: string | null;
          id?: string;
          owner_id?: string;
          priority?: string;
          recurrence?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      complete_recurring_task: {
        Args: { p_next_due: string; p_task_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      fin_nature: "nao_classificada" | "fixa" | "variavel" | "temporaria" | "anual";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      fin_nature: ["nao_classificada", "fixa", "variavel", "temporaria", "anual"],
    },
  },
} as const;
