<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Dashboard extends CI_Controller {
    public function __construct()
		{
			parent::__construct();
            user();
			date_default_timezone_set('Asia/Jakarta');
		}
	public function index()
	{
		$data = [
            'title' => 'Dashboard',
            'menu' => $this->db->get_where('user_menu', [
                'status' => 1
            ])->result(),
            'user' => $this->db->join('user_role', 'user_role.id = user.role_id')->get_where('user', ['email' => $this->session->userdata('email')])->row()
        ];

            $this->load->view('templates/dashboard/header', $data);
            $this->load->view('templates/dashboard/top-sidebar', $data);
            $this->load->view('templates/dashboard/index', $data);
            $this->load->view('templates/dashboard/footer');
        
	}
	public function component()
	{
		$data = [
            'title' => 'Components',
            'menu' => $this->db->get_where('user_menu', [
                'status' => 1
            ])->result()
        ];

            $this->load->view('templates/dashboard/header', $data);
            $this->load->view('templates/dashboard/top-sidebar', $data);
            $this->load->view('templates/dashboard/src/components', $data);
            $this->load->view('templates/dashboard/footer');
        
	}
	public function program()
	{
		$data = [
            'title' => 'Program',
            'menu' => $this->db->get_where('user_menu', [
                'status' => 1
            ])->result()
        ];

            $this->load->view('templates/dashboard/header', $data);
            $this->load->view('templates/dashboard/top-sidebar', $data);
            $this->load->view('templates/dashboard/src/program', $data);
            $this->load->view('templates/dashboard/footer');
        
	}

}
