"""
Tests for Supabase database schema validation
"""
import pytest
import re
from pathlib import Path


@pytest.fixture
def schema_file():
    """Load the database schema file"""
    schema_path = Path(__file__).parent.parent.parent / "supabase" / "migrations" / "001_initial_schema.sql"
    with open(schema_path, 'r') as f:
        return f.read()


class TestSchemaStructure:
    """Test database schema structure"""
    
    def test_schema_file_exists(self):
        """Test that schema file exists"""
        schema_path = Path(__file__).parent.parent.parent / "supabase" / "migrations" / "001_initial_schema.sql"
        assert schema_path.exists(), "Schema file should exist"
    
    def test_enums_defined(self, schema_file):
        """Test that required enums are defined"""
        assert "CREATE TYPE user_type" in schema_file
        assert "CREATE TYPE request_status" in schema_file
        assert "'blind'" in schema_file
        assert "'volunteer'" in schema_file
        assert "'pending'" in schema_file
        assert "'accepted'" in schema_file
    
    def test_tables_created(self, schema_file):
        """Test that all required tables are created"""
        required_tables = [
            "CREATE TABLE public.users",
            "CREATE TABLE public.help_requests",
            "CREATE TABLE public.sessions",
            "CREATE TABLE public.volunteer_behavior"
        ]
        
        for table in required_tables:
            assert table in schema_file, f"Table {table} should be defined"
    
    def test_rls_enabled(self, schema_file):
        """Test that RLS is enabled on all tables"""
        tables = ["users", "help_requests", "sessions", "volunteer_behavior"]
        
        for table in tables:
            assert f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY" in schema_file, \
                f"RLS should be enabled on {table}"
    
    def test_policies_defined(self, schema_file):
        """Test that RLS policies are defined"""
        # Check for policy creation statements
        assert "CREATE POLICY" in schema_file
        
        # Check for specific policies
        policy_patterns = [
            r"CREATE POLICY.*ON public\.users",
            r"CREATE POLICY.*ON public\.help_requests",
            r"CREATE POLICY.*ON public\.sessions",
            r"CREATE POLICY.*ON public\.volunteer_behavior"
        ]
        
        for pattern in policy_patterns:
            assert re.search(pattern, schema_file, re.IGNORECASE), \
                f"Policy pattern {pattern} should exist"


class TestUsersTable:
    """Test users table schema"""
    
    def test_users_table_columns(self, schema_file):
        """Test users table has required columns"""
        required_columns = [
            "id UUID",
            "type user_type",
            "availability BOOLEAN",
            "rating FLOAT",
            "reliability_score FLOAT",
            "last_active TIMESTAMPTZ",
            "created_at TIMESTAMPTZ"
        ]
        
        users_table_section = re.search(
            r"CREATE TABLE public\.users\s*\((.*?)\);",
            schema_file,
            re.DOTALL | re.IGNORECASE
        )
        
        assert users_table_section, "Users table definition should exist"
        table_def = users_table_section.group(1)
        
        for column in required_columns:
            assert column in table_def, f"Column {column} should exist in users table"
    
    def test_users_foreign_key(self, schema_file):
        """Test users table references auth.users"""
        assert "REFERENCES auth.users" in schema_file
        assert "ON DELETE CASCADE" in schema_file


class TestHelpRequestsTable:
    """Test help_requests table schema"""
    
    def test_help_requests_table_columns(self, schema_file):
        """Test help_requests table has required columns"""
        required_columns = [
            "id UUID",
            "user_id UUID",
            "status request_status",
            "assigned_volunteer UUID",
            "created_at TIMESTAMPTZ"
        ]
        
        table_section = re.search(
            r"CREATE TABLE public\.help_requests\s*\((.*?)\);",
            schema_file,
            re.DOTALL | re.IGNORECASE
        )
        
        assert table_section, "help_requests table definition should exist"
        table_def = table_section.group(1)
        
        for column in required_columns:
            assert column in table_def, f"Column {column} should exist in help_requests table"
    
    def test_help_requests_foreign_keys(self, schema_file):
        """Test help_requests foreign key references"""
        assert "REFERENCES public.users" in schema_file


class TestSessionsTable:
    """Test sessions table schema"""
    
    def test_sessions_table_columns(self, schema_file):
        """Test sessions table has required columns"""
        required_columns = [
            "id UUID",
            "help_request_id UUID",
            "user_id UUID",
            "volunteer_id UUID",
            "started_at TIMESTAMPTZ",
            "duration INTEGER"
        ]
        
        table_section = re.search(
            r"CREATE TABLE public\.sessions\s*\((.*?)\);",
            schema_file,
            re.DOTALL | re.IGNORECASE
        )
        
        assert table_section, "sessions table definition should exist"
        table_def = table_section.group(1)
        
        for column in required_columns:
            assert column in table_def, f"Column {column} should exist in sessions table"


class TestFunctions:
    """Test database functions"""
    
    def test_update_timestamp_function(self, schema_file):
        """Test update_updated_at_column function exists"""
        assert "CREATE OR REPLACE FUNCTION update_updated_at_column" in schema_file
        assert "RETURNS TRIGGER" in schema_file
    
    def test_handle_new_user_function(self, schema_file):
        """Test handle_new_user function exists"""
        assert "CREATE OR REPLACE FUNCTION public.handle_new_user" in schema_file
        assert "SECURITY DEFINER" in schema_file
    
    def test_increment_decline_count_function(self, schema_file):
        """Test increment_decline_count function exists"""
        assert "CREATE OR REPLACE FUNCTION public.increment_decline_count" in schema_file
    
    def test_triggers_created(self, schema_file):
        """Test that triggers are created"""
        assert "CREATE TRIGGER" in schema_file
        assert "update_users_updated_at" in schema_file
        assert "on_auth_user_created" in schema_file


class TestRealtime:
    """Test realtime publication"""
    
    def test_realtime_publication(self, schema_file):
        """Test that tables are added to realtime publication"""
        assert "ALTER PUBLICATION supabase_realtime ADD TABLE" in schema_file
        assert "public.help_requests" in schema_file
        assert "public.sessions" in schema_file


class TestSchemaSyntax:
    """Test SQL syntax validity"""
    
    def test_no_syntax_errors(self, schema_file):
        """Basic syntax check - no obvious SQL errors"""
        # Check for balanced parentheses in CREATE TABLE statements
        create_table_pattern = r"CREATE TABLE[^;]+;"
        matches = re.findall(create_table_pattern, schema_file, re.IGNORECASE | re.DOTALL)
        
        for match in matches:
            open_parens = match.count('(')
            close_parens = match.count(')')
            assert open_parens == close_parens, \
                f"Unbalanced parentheses in: {match[:50]}..."
    
    def test_semicolons_present(self, schema_file):
        """Test that statements end with semicolons"""
        statements = [
            "CREATE TYPE",
            "CREATE TABLE",
            "CREATE POLICY",
            "CREATE OR REPLACE FUNCTION",
            "CREATE TRIGGER"
        ]
        
        for statement_type in statements:
            # Find all instances
            pattern = f"{statement_type}[^;]+"
            matches = re.findall(pattern, schema_file, re.IGNORECASE | re.DOTALL)
            
            # Each should end with semicolon (or be part of a larger statement)
            for match in matches[:5]:  # Check first 5
                if match.count('(') == match.count(')'):
                    # Complete statement should end with semicolon
                    assert match.strip().endswith(';') or ';' in schema_file[schema_file.find(match):schema_file.find(match)+len(match)+10], \
                        f"Statement should end with semicolon: {match[:50]}..."

